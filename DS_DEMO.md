# Distributed Systems Demo Guide

This Spotify clone backend is no longer a single Node process. Catalog traffic is load-balanced across two API replicas, a Redis cache sits in front of list endpoints, and play events are processed asynchronously by a worker.

Frontend and admin still talk to `http://localhost:3000`. That port is the Nginx gateway, not a single Express instance.

## Architecture

```
Frontend / Admin
        |
     Nginx :3000  (round-robin load balancer)
       /        \
    api1        api2     (stateless catalog replicas)
       \        /
        Redis            (shared cache + durable play stream)
           |
     playcount worker    (consumer group on Redis Stream)
           |
     MongoDB Atlas       (shared source of truth, writeConcern majority)
           |
      Cloudinary         (audio/image blobs)
```

## Prerequisites

- Docker Desktop running
- `Spotify-Clone/Backend/.env` filled in (MongoDB + Cloudinary). Compose overrides `REDIS_URL` and `INSTANCE_ID` inside containers.
- Stop any local `npm run server` that is already bound to port 3000.

## Start the distributed backend

From `Spotify-Clone`:

```bash
docker compose up --build
```

You should see five services: `redis`, `api1`, `api2`, `worker`, `nginx`.

Then start the UIs as before:

```bash
# terminal 2
cd Frontend
npm run dev

# terminal 3
cd admin
npm run dev
```

## Live demo script (use this with the reviewer)

### 1. Replication and load balancing

```bash
curl -s http://localhost:3000/health
curl -s http://localhost:3000/health
```

`instanceId` should alternate between `api1` and `api2` (round-robin). Each JSON body and the `X-Instance-Id` header identify which replica handled the request.

**Textbook mapping:** stateless replicated servers, reverse-proxy load balancing.

### 2. Failover / availability

```bash
docker compose stop api1
curl -s http://localhost:3000/health
```

Requests keep succeeding on the remaining replica. Nginx marks the down instance failed (`max_fails=1`) and skips it.

Bring it back:

```bash
docker compose start api1
```

**Textbook mapping:** failure detection, redundancy, high availability. The system stays up after losing one replica (not after losing both, or Redis, or MongoDB).

### 3. Shared cache vs catalog writes

```bash
curl -sI http://localhost:3000/api/song/list
# first miss: X-Cache: MISS  (and cache: MISS in JSON)
curl -sI http://localhost:3000/api/song/list
# subsequent: X-Cache: HIT
```

Add or remove a song in the admin panel, then list again: you should see `MISS` because writes call `DEL` on `catalog:songs` and `catalog:albums`.

TTL is 60 seconds, so even without invalidation the cache would expire. Invalidation keeps the catalog closer to Mongo after writes.

**Textbook mapping:** cache-aside, cache invalidation, consistency vs latency. Both replicas share one Redis, so they do not each hold a private stale copy.

### 4. Async play pipeline (eventual consistency)

The UI POSTs `/api/play` when a track starts. The API only `XADD`s to Redis Stream `plays` and returns `202`. It does **not** increment `playCount` in the request path.

The worker runs `XREADGROUP` on consumer group `playcount-workers`, `$inc`s `playCount` in MongoDB, then deletes the song list cache.

Demo lag:

1. Note the play count on a song in the frontend (polls the list every 5 seconds).
2. `docker compose stop worker`
3. Play the same song several times. Counts should stay old; events pile up in the stream (`docker compose exec redis redis-cli XLEN plays`).
4. `docker compose start worker`. Counts catch up.

**Textbook mapping:** producer-consumer, durable queue, eventual consistency, crash recovery.

At-least-once delivery: Redis Streams can redeliver if the worker crashes after writing Mongo but before `XACK`. The worker sets `play:processed:{streamId}` with `SET NX` so a redelivered event is not counted twice.

### 5. Shared database vs app-level replication

API replicas do not replicate song documents to each other. They all read/write MongoDB Atlas with `writeConcern: majority`. Atlas already runs a replica set (Raft-like consensus inside the database). This project does **not** reimplement Raft at the application layer.

**Textbook mapping:** data replication delegated to the datastore; application replicas are stateless compute.

## CAP (honest)

- **Catalog writes** (add/remove song/album): wait for MongoDB majority. Prefer consistency of the catalog over serving a write if the DB cannot acknowledge. CP-leaning for metadata writes.
- **Play counts:** accepted as long as Redis Stream is up. A worker outage does not reject plays. AP / eventual for this metric.

Do not claim the whole system is strongly consistent.

## What this project did not build (and why)

- Raft / Paxos in Node: MongoDB already provides consensus for durable catalog data.
- Kubernetes / Kafka: extra ops cost without a stronger demo than Docker Compose + Redis Streams.
- JWT auth: out of scope for the DS argument.

Optional appendix if a reviewer wants two machines: run `api1` on host A and `api2` on host B, point both at the same Redis and MongoDB, and put Nginx on either host.

## Useful commands

```bash
docker compose ps
docker compose logs -f api1 api2 worker
docker compose exec redis redis-cli XLEN plays
docker compose exec redis redis-cli GET catalog:songs
docker compose stop worker
docker compose start worker
docker compose down
```

Local backend without Docker (single process, still uses Redis if it is running on localhost:6379):

```bash
cd Backend
npm run server
npm run worker
```
