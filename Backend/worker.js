import "dotenv/config";
import ConnectDB from "./src/config/mongodb.js";
import songModel from "./src/models/songModel.js";
import {
  getRedis,
  PLAY_STREAM,
  PLAY_GROUP,
  INSTANCE_ID,
  CACHE_KEYS,
} from "./src/config/redis.js";

const CONSUMER = process.env.WORKER_ID || `worker-${INSTANCE_ID}`;

const ensureGroup = async (redis) => {
  try {
    await redis.xgroup("CREATE", PLAY_STREAM, PLAY_GROUP, "0", "MKSTREAM");
    console.log(`Created consumer group ${PLAY_GROUP} on ${PLAY_STREAM}`);
  } catch (err) {
    if (!String(err.message).includes("BUSYGROUP")) {
      throw err;
    }
  }
};

const processEntry = async (redis, id, fields) => {
  const processedKey = `play:processed:${id}`;
  const reserved = await redis.set(processedKey, "1", "EX", 60 * 60 * 24 * 7, "NX");
  if (reserved !== "OK") {
    return;
  }

  const map = {};
  for (let i = 0; i < fields.length; i += 2) {
    map[fields[i]] = fields[i + 1];
  }

  const songId = map.songId;
  if (!songId) return;

  const updated = await songModel.findByIdAndUpdate(
    songId,
    { $inc: { playCount: 1 } },
    { new: true }
  );

  if (!updated) {
    console.warn(`Play event ${id}: song ${songId} not found`);
  } else {
    console.log(
      `Play event ${id}: ${updated.name} playCount=${updated.playCount}`
    );
    await redis.del(CACHE_KEYS.SONGS);
  }
};

const run = async () => {
  await ConnectDB();
  const redis = getRedis();
  if (!redis) {
    console.error("REDIS_URL is required for the playcount worker");
    process.exit(1);
  }

  await ensureGroup(redis);
  console.log(`Playcount worker ${CONSUMER} listening on stream ${PLAY_STREAM}`);

  while (true) {
    try {
      const res = await redis.xreadgroup(
        "GROUP",
        PLAY_GROUP,
        CONSUMER,
        "BLOCK",
        5000,
        "COUNT",
        10,
        "STREAMS",
        PLAY_STREAM,
        ">"
      );

      if (!res) continue;

      for (const [, entries] of res) {
        for (const [id, fields] of entries) {
          try {
            await processEntry(redis, id, fields);
            await redis.xack(PLAY_STREAM, PLAY_GROUP, id);
          } catch (err) {
            console.error(`Failed event ${id}:`, err.message);
            await redis.del(`play:processed:${id}`);
          }
        }
      }
    } catch (err) {
      console.error("Worker loop error:", err.message);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
