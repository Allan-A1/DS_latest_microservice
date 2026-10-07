import Redis from "ioredis";

const INSTANCE_ID = process.env.INSTANCE_ID || "local";
const REDIS_URL = process.env.REDIS_URL || "";

export const CACHE_KEYS = {
  SONGS: "catalog:songs",
  ALBUMS: "catalog:albums",
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
