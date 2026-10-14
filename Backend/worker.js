import "dotenv/config";
import ConnectDB from "./src/config/mongodb.js";
import songModel from "./src/models/songModel.js";
import albumModel from "./src/models/albumModel.js";
import {
  getRedis,
  INSTANCE_ID,
  CACHE_KEYS,
  incrementLeaderboard,
  acquireLock,
  releaseLock,
} from "./src/config/redis.js";
import {
  createConsumer,
  ensureTopics,
  TOPICS,
  CONSUMER_GROUPS,
} from "./src/config/kafka.js";

const CONSUMER_ID = process.env.WORKER_ID || `worker-${INSTANCE_ID}`;

const processMessage = async (redis, { topic, partition, message }) => {
  const offset = message.offset;
  let data = {};
  try {
    data = JSON.parse(message.value.toString());
  } catch (err) {
    console.error(`[${CONSUMER_ID}][Part:${partition}][Offset:${offset}] Failed to parse JSON:`, err.message);
    return;
  }

  const songId = data.songId;
  const correlationId =
    message.headers?.["x-correlation-id"]?.toString() ||
    data.correlationId ||
    "unknown";

  if (!songId) return;

  // Idempotency check: ensures at-least-once streaming delivery doesn't double-count plays
  const processedKey = `play:processed:${topic}:${partition}:${offset}`;
  if (redis) {
    const reserved = await redis.set(processedKey, "1", "EX", 60 * 60 * 24 * 7, "NX");
    if (reserved !== "OK") {
      console.log(`[${CONSUMER_ID}][Trace:${correlationId}] Skip duplicate event (Offset ${offset})`);
      return;
    }
  }

  try {
    // 1. Transactional / Persistent update in MongoDB Atlas
    const updated = await songModel.findByIdAndUpdate(
      songId,
      { $inc: { playCount: 1 } },
      { new: true }
    );

    // 2. Invalidate cached catalog so UI reflects new counts
    if (redis) {
      await redis.del(CACHE_KEYS.SONGS);
    }

    // 3. Update Real-Time In-Memory Distributed Leaderboard (Redis Sorted Set)
    await incrementLeaderboard(songId, 1);

    // -----------------------------------------------------------------------
    // 4. Distributed Lock — Album totalPlays (Mutual Exclusion)
    // -----------------------------------------------------------------------
    // Problem: worker1 and worker2 may process two songs from the same album
    // at exactly the same moment, causing a lost-update race on album.totalPlays.
    //
    // Solution: Each worker atomically acquires a Redis mutex lock keyed to
    // the album ID before writing. Only ONE worker holds the lock at a time.
    // The lock carries a unique token so only the holder can release it.
    // -----------------------------------------------------------------------
    if (updated?.album) {
      const albumResource = `album:${updated.album}`;
      const lockToken = `${CONSUMER_ID}:${offset}:${Date.now()}`;
      const lockTtlMs = 5000; // auto-expire after 5s even if worker crashes

      const acquired = await acquireLock(albumResource, lockToken, lockTtlMs);

      if (acquired) {
        console.log(
          `[${CONSUMER_ID}][Trace:${correlationId}][Lock] 🔒 Acquired lock for album "${updated.album}" (token: ${lockToken.slice(-8)})`
        );
        try {
          await albumModel.findOneAndUpdate(
            { name: updated.album },
            { $inc: { totalPlays: 1 } }
          );
        } finally {
          const released = await releaseLock(albumResource, lockToken);
          console.log(
            `[${CONSUMER_ID}][Trace:${correlationId}][Lock] 🔓 Released lock for album "${updated.album}" (success=${released})`
          );
        }
      } else {
        // Another worker holds the lock — back off; the album counter update
        // is skipped this cycle. At-most-once semantics for album aggregation.
        console.warn(
          `[${CONSUMER_ID}][Trace:${correlationId}][Lock] ⚠️  Lock contention on album "${updated.album}" — another worker holds the mutex, skipping album update.`
        );
      }
    }
    // -----------------------------------------------------------------------

    if (!updated) {
      console.warn(
        `[${CONSUMER_ID}][Trace:${correlationId}][Part:${partition}][Offset:${offset}] Warning: Song ${songId} not found in DB`
      );
    } else {
      console.log(
        `[${CONSUMER_ID}][Trace:${correlationId}][Part:${partition}][Offset:${offset}] Processed play for "${updated.name}" -> DB playCount=${updated.playCount}, Redis Leaderboard updated`
      );
    }
  } catch (err) {
    console.error(
      `[${CONSUMER_ID}][Trace:${correlationId}][Part:${partition}][Offset:${offset}] Error processing play:`,
      err.message
    );
    if (redis) {
      await redis.del(processedKey);
    }
    throw err; // Kafkajs will handle retry based on consumer policy
  }
};

const run = async () => {
  await ConnectDB();
  const redis = getRedis();

  console.log(`[${CONSUMER_ID}] Connecting to Kafka/Redpanda...`);
  await ensureTopics();

  const consumer = createConsumer(CONSUMER_GROUPS.PLAY_WORKERS);
  await consumer.connect();
  console.log(`[${CONSUMER_ID}] Kafka Consumer connected. Subscribing to "${TOPICS.SONG_PLAYS}"...`);

  await consumer.subscribe({
    topic: TOPICS.SONG_PLAYS,
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async (payload) => {
      await processMessage(redis, payload);
    },
  });

  console.log(`[${CONSUMER_ID}] Actively consuming stream partitions on topic "${TOPICS.SONG_PLAYS}"`);

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log(`[${CONSUMER_ID}] Shutting down gracefully...`);
    try {
      await consumer.disconnect();
    } catch (_) {}
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

run().catch((err) => {
  console.error(`[${CONSUMER_ID}] Fatal worker error:`, err);
  process.exit(1);
});
