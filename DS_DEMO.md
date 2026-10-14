# Distributed Systems Demo Guide

This Spotify clone backend is a multi-tier, event-driven distributed system. Traffic is load-balanced across multiple API replicas via Nginx, protected by a distributed Redis rate limiter, instrumented with end-to-end correlation tracing, streamed through a **Redpanda (Kafka-compatible)** event broker with a live web UI dashboard, and consumed by competing worker replicas with an in-memory real-time trending leaderboard.

---

## 1. System Architecture

```
Frontend / Admin (React)
        │
        ▼ HTTP :3000
    ┌───────────────────────────────────┐
    │  Nginx Load Balancer (:3000)      │
    └──────┬─────────────────────┬──────┘
           │ (Round-Robin)       │ (Failover)
           ▼                     ▼
    ┌─────────────┐       ┌─────────────┐
    │  api1:3000  │       │  api2:3000  │  (Stateless Node.js Replicas)
    └──────┬──────┘       └──────┬──────┘
           │                     │
           ├─────────────────────┴──────────────────────────────┐
           ▼                                                    ▼
    ┌─────────────────────────┐                     ┌───────────────────────────┐
    │  Redis (:6379)          │                     │  Redpanda Broker (:9092)  │
    │  • Shared Catalog Cache │                     │  • Topic: song-plays      │
    │  • Distributed Limiter  │                     │  • 3 Partitions           │
    │  • Real-time Top Songs  │                     │  • Web Console (:8080)    │
    └──────────▲──────────────┘                     └─────────────▲─────────────┘
               │                                                  │
               └───────────────────────┬──────────────────────────┘
                                       │ Consumer Group: playcount-workers
                          ┌────────────┴────────────┐
                          ▼                         ▼
                   ┌─────────────┐           ┌─────────────┐
                   │   worker1   │           │   worker2   │  (Competing Consumers)
                   └──────┬──────┘           └──────┬──────┘
                          │                         │
                          └────────────┬────────────┘
                                       ▼
                             ┌───────────────────┐
                             │   MongoDB Atlas   │  (Shared Ledger / Consensus)
                             └───────────────────┘
```

---

## 2. Services in `docker-compose.yml`

| Service | Technology | Port | Purpose |
|---|---|---|---|
| `nginx` | Nginx 1.27 Alpine | `:3000` | Gateway, reverse proxy, round-robin load balancer, trace forwarding |
| `api1`, `api2` | Node.js Express | `:3000` (internal) | Stateless API replicas with distributed rate limiter |
| `redpanda` | Redpanda v24 (Kafka) | `:9092` | Distributed event streaming broker (topic: `song-plays`) |
| `redpanda-console` | Redpanda Console UI | `:8080` | **Live Web GUI** to observe topics, partitions, and message offsets |
| `worker1`, `worker2`| Node.js KafkaJS | Background | Competing consumer replicas handling partition streams |
| `redis` | Redis 7 Alpine | `:6379` | Shared cache, distributed rate limiter, real-time leaderboard sorted set |

---

## 3. Starting the Distributed Backend

From the project root:

```bash
docker compose up --build
```

You should see 7 containers start and pass health checks:
`spotify-redis`, `spotify-redpanda`, `spotify-redpanda-console`, `spotify-api1`, `spotify-api2`, `spotify-worker1`, `spotify-worker2`, `spotify-nginx`.

Start the frontend and admin panels:
```bash
# Terminal 2: Listener UI
cd Frontend && npm run dev

# Terminal 3: Admin UI
cd admin && npm run dev
```

---

## 4. Live Demo Script (For Reviewers / Viva)

### 1. Visual Event Streaming in Redpanda Console (The "Wow" Demo)
1. Open **`http://localhost:8080`** in your browser.
2. Click **Topics** -> **`song-plays`**. Notice the 3 partitions!
3. Click on the song player in the Frontend to start playing a track.
4. Refresh/watch the **Messages** tab in Redpanda Console:
   - You will see the event appear with message key (`songId`), timestamp, payload, and `x-correlation-id` header!
5. Click **Consumers**: show the consumer group `playcount-workers` with active members (`worker1`, `worker2`) and 0 consumer lag.

---

### 2. Competing Consumers & Partition Balancing
Show how two background worker replicas share partitions without duplicate work:
```bash
docker compose logs -f worker1 worker2
```
Play 2 or 3 different songs in the UI.
- Notice song A goes to `Partition 0` and is processed by `worker1`.
- Notice song B goes to `Partition 1` and is processed by `worker2`.
- **Textbook mapping:** Competing Consumers Pattern, dynamic partition rebalancing, horizontal scaling.

---

### 3. End-to-End Distributed Tracing (`X-Correlation-Id`)
1. Make an API call or observe browser network tab:
   ```bash
   curl -i http://localhost:3000/api/song/list
   ```
2. Note the response headers:
   - `X-Instance-Id`: `api1` or `api2`
   - `X-Correlation-Id`: `c830bf98-b80c-40fa-8027-...`
3. Search Docker logs for that exact ID:
   ```bash
   docker compose logs | grep <correlation-id>
   ```
   You will see the log start at Nginx, processed by an API replica, sent to Redpanda, and picked up by a worker!

---

### 4. Real-Time Distributed Leaderboard (Redis Sorted Sets)
Query the real-time trending endpoint:
```bash
curl -s http://localhost:3000/api/song/trending
```
- Each time a song is played, the worker executes `ZINCRBY leaderboard:trending 1 <songId>` in Redis.
- The trending endpoint immediately serves the top songs directly from in-memory sorted sets with zero MongoDB aggregation queries!

---

### 5. Distributed Rate Limiter
Send rapid requests to test the global rate limiter across replicas:
```bash
# In PowerShell:
1..10 | ForEach-Object { curl -sI http://localhost:3000/api/song/list }
```
Inspect the headers:
- `X-RateLimit-Limit: 120`
- `X-RateLimit-Remaining: 119, 118, ...`
- `X-RateLimit-Reset: 59`
Because the limiter state lives in Redis, requests hitting either `api1` or `api2` deduct from the same global quota.

---

### 6. High Availability & Failover
Kill one API replica during live usage:
```bash
docker compose stop api1
curl -s http://localhost:3000/health
```
Nginx automatically routes 100% of traffic to `api2` with **zero failed requests**.
Start it back up:
```bash
docker compose start api1
```

---

## 5. Architectural Theory & CAP Mapping

* **Consistency vs Latency:** Catalog metadata writes (add/remove song) synchronize through MongoDB with `writeConcern: majority`.
* **Eventual Consistency:** Play count recording is fully asynchronous via Redpanda events. High burst traffic will never degrade user playback latency.
* **Idempotency:** Workers use atomic `SET NX` locks on `play:processed:<topic>:<partition>:<offset>` to ensure at-least-once streaming delivery never counts a play twice.
