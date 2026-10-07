import { getRedis, PLAY_STREAM, INSTANCE_ID } from "../config/redis.js";

const enqueuePlay = async (req, res) => {
  const redis = getRedis();
  const { songId } = req.body;

  if (!songId) {
    return res.status(400).json({ success: false, message: "songId is required" });
  }

  if (!redis) {
    return res.status(503).json({
      success: false,
      message: "Play stream unavailable (Redis not configured)",
      instanceId: INSTANCE_ID,
    });
  }

  try {
    const streamId = await redis.xadd(
      PLAY_STREAM,
      "*",
      "songId",
      String(songId),
      "enqueuedBy",
      INSTANCE_ID,
      "enqueuedAt",
      Date.now().toString()
    );

    res.status(202).json({
      success: true,
      message: "Play event queued",
      streamId,
      instanceId: INSTANCE_ID,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to enqueue play event" });
  }
};

export { enqueuePlay };
