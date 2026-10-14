import Redis from "ioredis";

const INSTANCE_ID = process.env.INSTANCE_ID || "local";
const REDIS_URL = process.env.REDIS_URL || "";

export const CACHE_KEYS = {
  SONGS: "catalog:songs",
  ALBUMS: "catalog:albums",
  LEADERBOARD: "leaderboard:trending",
};

export const PLAY_STREAM = "plays";
export const PLAY_GROUP = "playcount-workers";

let redis = null;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });
  redis.on("connect", () => {
    console.log(`Redis connected (${INSTANCE_ID})`);
  });
  redis.on("error", (err) => {
    console.error("Redis error:", err.message);
  });
} else {
  console.warn("REDIS_URL not set — cache and play stream disabled");
}

export const getRedis = () => redis;
export { INSTANCE_ID };

export async function getCachedJson(key) {
  if (!redis) return null;
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
}

export async function setCachedJson(key, value, ttlSeconds = 60) {
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

export async function invalidateCatalogCache() {
  if (!redis) return;
  await redis.del(CACHE_KEYS.SONGS, CACHE_KEYS.ALBUMS);
}

export async function redisReady() {
  if (!redis) return false;
  try {
    return (await redis.ping()) === "PONG";
  } catch {
    return false;
  }
}

export async function incrementLeaderboard(songId, increment = 1) {
  if (!redis) return null;
  try {
    return await redis.zincrby(CACHE_KEYS.LEADERBOARD, increment, String(songId));
  } catch (err) {
    console.error("Leaderboard increment error:", err.message);
    return null;
  }
}

export async function getTopTrendingSongIds(limit = 10) {
  if (!redis) return [];
  try {
    // Returns array of [songId, score, songId, score, ...] with WITHSCORES
    return await redis.zrevrange(CACHE_KEYS.LEADERBOARD, 0, limit - 1, "WITHSCORES");
  } catch (err) {
    console.error("Leaderboard fetch error:", err.message);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Distributed Mutex Lock (Redlock-style)
// ---------------------------------------------------------------------------
// Prevents race conditions when multiple worker replicas update the same
// shared resource (e.g., album.totalPlays) simultaneously.
//
// Pattern: SET lock:<resource> <unique-token> NX PX <ttlMs>
//   NX  → only set if key does Not eXist (atomic acquisition)
//   PX  → auto-expire in <ttlMs> ms (safety: lock never stays forever if worker crashes)
//
// Release: Lua script atomically checks the token before deleting.
//   This ensures Worker-2 cannot accidentally unlock a lock held by Worker-1.
// ---------------------------------------------------------------------------

const LOCK_RELEASE_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  else
    return 0
  end
`;

/**
 * Acquire a distributed Redis lock for a named resource.
 * @param {string} resource  - e.g. "album:60f1b2c3d4"
 * @param {string} token     - unique caller ID (e.g. `${WORKER_ID}:${Date.now()}`)
 * @param {number} ttlMs     - lock TTL in milliseconds (safety expiry)
 * @returns {boolean}        - true if lock was acquired, false if already held
 */
export async function acquireLock(resource, token, ttlMs = 5000) {
  if (!redis) return true; // fail-open if Redis is unavailable
  try {
    const result = await redis.set(`lock:${resource}`, token, "NX", "PX", ttlMs);
    return result === "OK";
  } catch (err) {
    console.error(`[Lock] acquireLock failed for "${resource}":`, err.message);
    return true; // fail-open
  }
}

/**
 * Release a distributed Redis lock.
 * Uses an atomic Lua script to ensure only the lock owner can release it.
 * @param {string} resource  - same resource string used in acquireLock
 * @param {string} token     - same token used in acquireLock
 * @returns {boolean}        - true if released, false if token mismatch
 */
export async function releaseLock(resource, token) {
  if (!redis) return true;
  try {
    const released = await redis.eval(LOCK_RELEASE_SCRIPT, 1, `lock:${resource}`, token);
    return released === 1;
  } catch (err) {
    console.error(`[Lock] releaseLock failed for "${resource}":`, err.message);
    return false;
  }
}

