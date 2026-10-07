# Spotify Clone — What Changed and How to Demo It

This document explains the distributed-systems work in **plain language**, then gives an exact **live demo script** for a reviewer or viva. Command-style notes also live in [DS_DEMO.md](DS_DEMO.md).

Your Docker logs already show a healthy system: Redis up, Nginx up, `api1` and `api2` connected to Redis and MongoDB, worker listening on the `plays` stream.

---

## 1. The problem we started with

The original app was a normal MERN lab:

- One Node/Express process in `Backend/server.js`
- MongoDB Atlas for songs and albums
- Cloudinary for mp3 and images
- React **Frontend** (listener) and **admin** (upload)

That is a **single server**. If that process dies, the whole API dies. There is no load balancing, no shared cache, no background processing. A distributed-systems reviewer can fairly say: “This is not DS; it is one program talking to a hosted database.”

MongoDB Atlas is already a replicated database in the cloud. That helps, but **your application** was still one process. The work below makes the **application tier** distributed.

---

## 2. The idea in one picture

Think of a shop:

| Shop analogy | In this project |
|--------------|-----------------|
| Two identical cashiers | `api1` and `api2` (same code, two containers) |
| Manager at the door who picks a cashier | Nginx on `localhost:3000` |
| Whiteboard of today’s menu (fast, can be slightly old) | Redis cache of song/album lists |
| Suggestion box that a clerk empties later | Redis Stream `plays` + playcount `worker` |
| Official stock ledger | MongoDB Atlas |
| Warehouse for bulky items | Cloudinary (audio/images) |

```
  Browser (Frontend on :5173)
  Browser (Admin on :5173 or :5174)
                 |
                 v
        Nginx  localhost:3000
           /            \
        api1            api2
           \            /
              Redis
                |
             worker
                |
          MongoDB Atlas
```

**Important:** Frontends still call `http://localhost:3000`. That port is **no longer a single Express app**. It is Nginx, which forwards to `api1` or `api2`.

---

## 3. What each container is (match this to `docker compose up`)

Five services in `docker-compose.yml`:

### redis

In-memory store used for two jobs:

1. **Cache** keys `catalog:songs` and `catalog:albums` (JSON lists, TTL 60 seconds).
2. **Queue** (Redis Stream named `plays`) of “user started this song” events.

Log you already saw: `Ready to accept connections tcp`.

### api1 and api2

Two copies of the same Node backend. They can all:

- List / add / remove songs and albums
- Enqueue play events
- Answer `GET /health` with their name (`instanceId`: `api1` or `api2`)

They do **not** keep the song catalog only in their own RAM. Both talk to the **same** MongoDB and the **same** Redis. That is why killing one API does not lose the library.

Logs you already saw:

```
Server api1 running on port 3000
Server api2 running on port 3000
Redis connected (api1)
Redis connected (api2)
MongoDB Connected
```

### worker

A **different program** (`worker.js`) from the same backend image. It does not serve HTTP. It loops:

1. Read new messages from stream `plays` (consumer group `playcount-workers`)
2. Increment `playCount` on that song in MongoDB
3. Delete the song-list cache so the UI can see the new number
4. Acknowledge the message

Log you already saw:

```
Created consumer group playcount-workers on plays
Playcount worker worker-1 listening on stream plays
```

### nginx

Public door. Host port **3000** maps to Nginx port 80. It round-robins to `api1:3000` and `api2:3000`.

The line `can not modify /etc/nginx/conf.d/default.conf (read-only file system?)` is **not a failure**. We mount our config as read-only on purpose. Then you saw `ready for start up`.

---

## 4. What we actually changed in code (no magic)

### Replicas and identity

- Env var `INSTANCE_ID` (`api1` / `api2` / `worker`)
- Every HTTP response gets header `X-Instance-Id`
- `GET /health` returns `{ status, instanceId, redis, uptime }`

### Cache (cache-aside)

On `GET /api/song/list` and `GET /api/album/list`:

1. If Redis has the key → return it, `X-Cache: HIT`
2. Else read MongoDB, store in Redis for 60s, `X-Cache: MISS`

On add/remove song or album: `DEL` those Redis keys (**invalidation**). Both replicas share Redis, so they do not each keep a private stale list.

### Play pipeline (eventual consistency)

When you click play in the Frontend:

1. UI `POST /api/play` with `{ songId }`
2. API **does not** increment the counter. It `XADD`s to Redis Stream `plays` and returns **202 Accepted**
3. Worker later `$inc` playCount in Mongo
4. Frontend refetches the song list every 5 seconds, so the “N plays” label catches up after a short delay

That delay is the feature you demo, not a bug.

### Idempotency (at-least-once)

Streams can redeliver if the worker dies after writing Mongo but before ACK. The worker does `SET play:processed:{streamId} NX` so a duplicate event is not counted twice.

### MongoDB

Connect uses `writeConcern: majority`. Catalog writes wait until a majority of the Atlas replica set has the write. We did **not** implement Raft in Node; Atlas already does consensus for the database.

### Docker

- `Backend/Dockerfile` — Node 20 image for API and worker
- `docker-compose.yml` — redis, api1, api2, worker, nginx
- `nginx/nginx.conf` — upstream round-robin, skip a dead replica (`max_fails=1`)

### Small UI hook

Song cards show `playCount` plays. Play/next/previous enqueue a play event.

---

## 5. Distributed-systems vocabulary (say these words)

Use this table in the report and viva.

| Demo | Textbook term |
|------|----------------|
| Two API containers, same code | **Replication** of a **stateless** service |
| Nginx sending requests to both | **Load balancing** (reverse proxy) |
| Kill api1, site still works | **Availability**, **failover**, failure detection |
| Song list from Redis | **Caching**, cache-aside |
| Add song then cache MISS | **Cache invalidation** |
| Play goes to a stream, count updates later | **Asynchronous communication**, **message queue**, **eventual consistency** |
| Stop worker, events wait, start worker, counts jump | **Producer–consumer**, **crash recovery**, durable log |
| Processed-id set | **At-least-once delivery** + **idempotent** consumer |
| Both APIs see the same Mongo document | Shared **source of truth**; data replication is in Atlas, not between Node processes |

### CAP — be honest

Do **not** say “this system is CAP consistent” as a slogan.

- **Catalog writes** (add/remove song): wait for Mongo majority → closer to **CP** (prefer a correct catalog over a write that might vanish).
- **Play counts**: accept the event if Redis is up even if the worker is dead → closer to **AP / eventual** for that metric.

Different subsystems, different tradeoffs. Reviewers like that.

### What we refused to fake

- No Raft/Paxos written in JavaScript
- No Kubernetes, no Kafka cluster
- No JWT (the old README mentioned login; the code never had it)

---

## 6. What must be running for a demo

1. **Docker Desktop** running (you already did `docker compose up --build` from `Spotify-Clone`).
2. **Do not** also run `npm run server` on the host — that fights Nginx for port 3000.
3. **Frontend** in another terminal:

```powershell
cd C:\Users\sanja\Downloads\Spotify_1\Spotify-Clone\Frontend
npm run dev
```

4. **Admin** in another terminal:

```powershell
cd C:\Users\sanja\Downloads\Spotify_1\Spotify-Clone\admin
npm run dev
```

If Frontend already uses http://localhost:5173, Vite will put admin on **5174**. Use the URL printed in that terminal.

Leave the compose terminal open so you can show live logs (`Play event ... playCount=`).

---

## 7. Live demo script (do this in order)

Open a **new** PowerShell in `C:\Users\sanja\Downloads\Spotify_1\Spotify-Clone` for curl/docker commands. Keep compose running in the other window.

### Step 0 — Show five processes (30 seconds)

```powershell
docker compose ps
```

You want `redis`, `api1`, `api2`, `worker`, `nginx` **Up**.

**Say:** “The catalog API is replicated. A gateway, a shared cache/queue, and an async worker are separate processes.”

### Step 1 — Load balancing / two servers (1 minute)

```powershell
curl.exe -s http://localhost:3000/health
curl.exe -s http://localhost:3000/health
```

Expect JSON like:

```json
{"status":"ok","instanceId":"api1","redis":true,...}
```

then the next call `"instanceId":"api2"` (order can start with api2).

**Say:** “Nginx round-robins across replicas. `instanceId` proves it is not one process pretending to be two.”

Optional: open http://localhost:3000/ in a browser; you should see JSON with `API working` and an `instanceId`. Refresh to see it flip.

### Step 2 — Failover (2 minutes)

```powershell
docker compose stop api1
curl.exe -s http://localhost:3000/health
```

Refresh the listener app. Songs should still load. Health should stay on **api2**.

```powershell
docker compose start api1
```

Hit `/health` a few more times; both names should return.

**Say:** “Redundancy. Losing one replica is tolerated. Losing both APIs, or Redis, or MongoDB, would not be — we are not claiming infinite fault tolerance.”

### Step 3 — Cache hit / miss (2 minutes)

```powershell
curl.exe -sI http://localhost:3000/api/song/list
curl.exe -sI http://localhost:3000/api/song/list
```

Look for header `X-Cache: MISS` then `X-Cache: HIT` (first request after a cache clear is MISS).

JSON body also has `"cache":"HIT"` or `"MISS"`.

Then in **Admin**, add a tiny song (or remove one). List again:

```powershell
curl.exe -sI http://localhost:3000/api/song/list
```

You should see **MISS** because writes delete the cache keys.

**Say:** “Cache-aside with invalidation. TTL is 60 seconds as a safety net. Both replicas share Redis so they do not diverge.”

### Step 4 — Eventual consistency of play counts (the money demo, 3–4 minutes)

1. Open the Frontend. Note **plays** under a song (for example `0 plays` or `2 plays`).
2. Stop the consumer:

```powershell
docker compose stop worker
```

3. Play the same song **several times** (click it, or play/pause play). The number on screen should **stay old** (UI polls every 5 seconds, but Mongo was not updated).
4. Show the queue growing:

```powershell
docker compose exec redis redis-cli XLEN plays
```

Number should be > 0 (pending events).

5. Bring the worker back:

```powershell
docker compose start worker
```

Watch the compose logs: `Play event ... playCount=...`

6. Wait up to ~5 seconds, or refresh. The label should jump by roughly how many times you played.

**Say:** “The play request only enqueues. The worker is a consumer. That is eventual consistency. If the worker crashes, the stream retains events; restart recovers. That is crash recovery, not a lost update in the happy path.”

### Step 5 — Shared database (30 seconds)

Add a song in Admin. Call `/health` twice so you hit both APIs. Both should list the new song. You did not copy files between api1 and api2; they read the same MongoDB.

**Say:** “Compute is replicated; durable catalog state is in Atlas with majority writes. We did not reimplement consensus in the app.”

---

## 8. What to say if they grill you

**“Is Docker on one laptop really distributed?”**  
Yes for this course: multiple processes, a network between them, independent failure, a queue, a cache. If they want two physical machines: run api1 on PC A and api2 on PC B, same Redis and MongoDB, Nginx on one host. Same architecture.

**“Why not Kafka / K8s?”**  
Same demo (queue + replicas) with more ops and a higher chance of a broken live review. Redis Streams is a real durable log with consumer groups.

**“Why not Raft?”**  
MongoDB Atlas already elects a primary. Building toy Raft would not store the songs you already have.

**“Is play count strongly consistent?”**  
No. That is intentional. Catalog metadata is the stricter path.

**“Nginx read-only warning?”**  
Harmless; config is bind-mounted read-only.

---

## 9. One sentence for the title slide

We turned a single Express API into a **replicated catalog** behind a **load balancer**, with a **shared Redis cache** and an **asynchronous play-count pipeline**, so we can demonstrate **replication, failover, caching, and eventual consistency** on a working Spotify clone.

---

## 10. Commands cheat sheet

All from folder `Spotify-Clone`:

```powershell
docker compose ps
docker compose logs -f api1 api2 worker
curl.exe -s http://localhost:3000/health
curl.exe -sI http://localhost:3000/api/song/list
docker compose stop api1
docker compose start api1
docker compose stop worker
docker compose start worker
docker compose exec redis redis-cli XLEN plays
docker compose down
```
