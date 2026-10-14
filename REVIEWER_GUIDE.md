# Spotify Clone — Distributed Systems Reviewer Guide & Viva Cheat Sheet

This document explains the distributed-systems architecture in **plain language**, provides a **live demo walkthrough**, and gives exact answers for a reviewer or viva examination.

---

## 1. What Changed from a Basic MERN App

The original application was a single-process monolithic app:
- 1 Node/Express process
- Frontend talked directly to that single process
- If the Node process crashed, the entire application died
- No load balancing, no distributed event bus, no caching, and no tracing

### The Distributed Architecture:
```
  Browser (Frontend on :5173 / Admin on :5173 or :5174)
                       │
                       ▼
             Nginx (localhost:3000)
             [Load Balancer & Gateway]
                 /            \
        (Round-Robin)       (Failover)
               ▼                ▼
             api1              api2
      [Express Replica]  [Express Replica]
             │   \            /   │
             │    ▼          ▼    │
             │   Redis (Cache &   │
             │   Rate Limiter)    │
             │                    │
             └──────────┬─────────┘
                        ▼
            Redpanda (Kafka Broker :9092)
            [Topic: song-plays | 3 Partitions]
            [Redpanda Console Dashboard :8080]
                   /               \
         (Partition 0, 1)      (Partition 2)
                 ▼                   ▼
              worker1             worker2
         [Consumer Replica]  [Consumer Replica]
                 \                   /
                  ▼                 ▼
             MongoDB Atlas      Redis Leaderboard
             (Shared Ledger)    (Real-time Top Songs)
```

---

## 2. Distributed Systems Concepts Implemented

| Project Component | Distributed Systems Principle | Why It Matters |
|---|---|---|
| **Nginx (`localhost:3000`)** | **Reverse Proxy & Load Balancing** | Distributes HTTP requests across replicas; single virtual IP/gateway. |
| **`api1` & `api2`** | **Stateless Replication & High Availability** | Either node can fail without bringing down the system. |
| **Redpanda (`:9092`)** | **Event-Driven Streaming & Partitioning** | High-throughput asynchronous broker; events partitioned by `songId`. |
| **Redpanda Console (`:8080`)** | **Distributed Observability** | Live web GUI showing topics, partition offsets, consumer group lag. |
| **`worker1` & `worker2`** | **Competing Consumers Pattern** | Two worker replicas dynamically balance partitions in the same consumer group. |
| **`X-Correlation-Id`** | **Distributed Tracing** | Propagates a unique request ID across Nginx -> API -> Redpanda -> Workers -> Logs. |
| **Redis Shared Cache** | **Cache-Aside Pattern & Cache Invalidation** | Eliminates repeated queries to MongoDB; invalidated on catalog mutations. |
| **Redis Sorted Set** | **Real-Time Analytics Aggregation** | Computes top trending songs (`ZINCRBY`) asynchronously without database table scans. |
| **Distributed Rate Limiter** | **Coordinated Resource Protection** | Global sliding window rate limiter shared by all API replicas in Redis. |
| **`play:processed:...`** | **Idempotent Consumer** | Guards against duplicate increments in at-least-once streaming delivery. |
| **MongoDB Atlas** | **Quorum / Consensus** | Uses `writeConcern: majority` to guarantee data durability across cloud replicas. |
| **Redis Mutex Lock (`lock:album:...`)** | **Distributed Mutual Exclusion** | `SET NX PX` lock prevents concurrent workers from causing a lost-update race on `album.totalPlays`. Atomic Lua script ensures only the lock holder can release it. |

---

## 3. The 7 Containers in `docker-compose.yml`

1. **`spotify-redis`**:
   - In-memory cache for song/album lists (`catalog:songs`, `catalog:albums`).
   - Shared counter store for distributed rate limiting.
   - Real-time leaderboard sorted set (`leaderboard:trending`).
2. **`spotify-redpanda`**:
   - High-performance, C++ Kafka-compatible streaming engine.
   - Manages topic `song-plays` with 3 partitions.
3. **`spotify-redpanda-console`**:
   - Browser-based graphical management UI running on `http://localhost:8080`.
4. **`spotify-api1` & `spotify-api2`**:
   - Identical stateless Express containers. Each stamps responses with `X-Instance-Id` and `X-Correlation-Id`.
5. **`spotify-worker1` & `spotify-worker2`**:
   - Background worker replicas belonging to the `playcount-workers` consumer group.
   - Process partition streams, increment MongoDB counters, and update the Redis leaderboard.
6. **`spotify-nginx`**:
   - Entry point listening on port `3000`. Round-robins between `api1` and `api2`.

---

## 4. Live Demo Walkthrough (Step-by-Step)

### Step 1: Show the Redpanda Console UI
* Open **`http://localhost:8080`** in Chrome/Edge.
* Navigate to **Topics** -> **`song-plays`**.
* **Say to reviewer:** *“We replaced basic synchronous database writes with an Event-Driven Architecture using Redpanda, an ultra-fast Kafka-compatible event broker. Here you can see our partitioned topic and active consumer groups.”*

### Step 2: Play a Song & Watch the Message Stream
* Open the Spotify frontend on `http://localhost:5173` and click Play on a track.
* In Redpanda Console under **Messages**, click search/refresh.
* Show the message payload, key (`songId`), and header `x-correlation-id`.
* **Say to reviewer:** *“When a user plays a song, the API immediately acknowledges with HTTP 202 Accepted and streams the event to Redpanda. This decouples user experience from database latency.”*

### Step 3: Show Competing Workers in Terminal
* Run:
  ```bash
  docker compose logs -f worker1 worker2
  ```
* Play 2 different tracks in the UI.
* Point out that `worker1` handles one partition while `worker2` handles another:
  `[worker-1][Trace:...][Part:0] Processed play...`
  `[worker-2][Trace:...][Part:1] Processed play...`
* **Say to reviewer:** *“We have horizontally scaled workers using the Competing Consumers Pattern. Redpanda dynamically distributes partition ownership across workers.”*

### Step 4: Show Distributed Tracing
* Run:
  ```bash
  curl -i http://localhost:3000/api/song/trending
  ```
* Highlight `X-Correlation-Id` in the response header.
* Show that this same ID appears in the API log and worker log.
* **Say to reviewer:** *“In a distributed system, a single user request traverses multiple network boundaries. We propagate an end-to-end Correlation ID to trace the complete lifecycle of a request.”*

### Step 5: High Availability Failover
* Run:
  ```bash
  docker compose stop api1
  curl -s http://localhost:3000/health
  ```
* Requests continue seamlessly via `api2`.
* Restart it:
  ```bash
  docker compose start api1
  ```

---

## 5. Typical Viva / Reviewer Questions & Model Answers

### Q1: "Why use Redpanda instead of doing everything in MongoDB or Redis?"
> **Answer:** *"If 100,000 users play songs concurrently, hitting MongoDB directly for each play causes massive write lock contention and latency spikes. Redpanda buffers and partitions events at streaming speed. Additionally, Redpanda allows multiple decoupled consumers (e.g. play counter, trending analytics, fraud detection) to read from the same topic independently without burdening the primary database."*

### Q2: "How do you handle duplicate messages in Kafka/Redpanda?"
> **Answer:** *"Kafka guarantees at-least-once delivery, meaning network retries could re-deliver an event. Our workers implement an **Idempotent Consumer Pattern** using Redis atomic `SET NX` locks with the event's topic, partition, and offset. If an offset was already processed, it is safely ignored."*

### Q3: "What is the CAP Theorem trade-off in your system?"
> **Answer:** 
> - *"For catalog metadata (adding/removing songs), we prioritize **Consistency (CP-leaning)** by requiring `writeConcern: majority` in MongoDB Atlas before confirming writes."*
> - *"For play counts and streaming analytics, we prioritize **Availability and Partition Tolerance (AP / Eventual Consistency)**. Even if workers are temporarily paused, play events are safely buffered in Redpanda without interrupting user playback."*

### Q4: "What happens if Redis fails?"
> **Answer:** *"Our system uses **Graceful Degradation**. If Redis is unavailable, the catalog endpoint falls back directly to MongoDB, and the rate limiter fails open so users are not blocked. Redis is an accelerator, not a single point of absolute failure."*

### Q5: "What is a distributed lock and why do you need one here?"
> **Answer:** *"When `worker1` and `worker2` concurrently process two songs from the same album, they both try to increment `album.totalPlays` at the same time. Without coordination, this is a **lost-update race condition** — both workers read the same stale value and one increment is silently overwritten. Our solution is a **Redis Mutex Lock** using the `SET NX PX` command: NX (Not eXists) makes the lock acquisition atomic — only one worker wins. PX sets a TTL so the lock auto-expires if the holder crashes. A unique per-message token is stored in the lock, and an atomic **Lua script** is used for safe release: it checks the token before deleting, preventing Worker-2 from accidentally unlocking a lock held by Worker-1. This is a simplified implementation of the industry-standard **Redlock algorithm**."*

### Q6: "How can you demo lock contention?"
> **Answer:** *"Play two songs from the same album in rapid succession. In the worker logs you will see:*
> ```
> [worker-1][Lock] 🔒 Acquired lock for album "Pop Hits" (token: ...abc1234)
> [worker-2][Lock] ⚠️  Lock contention on album "Pop Hits" — another worker holds the mutex
> [worker-1][Lock] 🔓 Released lock for album "Pop Hits" (success=true)
> ```
> *This proves our distributed lock enforces mutual exclusion across independent processes on separate containers."*
