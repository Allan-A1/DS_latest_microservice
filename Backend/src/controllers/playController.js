import { getProducer, TOPICS } from "../config/kafka.js";
import { INSTANCE_ID } from "../config/redis.js";

const enqueuePlay = async (req, res) => {
  const { songId } = req.body;
  const correlationId = req.correlationId || req.headers["x-correlation-id"] || "unknown";

  if (!songId) {
    return res.status(400).json({
      success: false,
      message: "songId is required",
      correlationId,
      instanceId: INSTANCE_ID,
    });
  }

  try {
    const producer = await getProducer();

    // In Kafka / Redpanda, setting the message key to songId ensures all plays
    // for this specific song route to the exact same partition (strict event ordering)
    const recordMetadata = await producer.send({
      topic: TOPICS.SONG_PLAYS,
      messages: [
        {
          key: String(songId),
          value: JSON.stringify({
            songId: String(songId),
            enqueuedBy: INSTANCE_ID,
            enqueuedAt: Date.now(),
            correlationId,
          }),
          headers: {
            "x-correlation-id": correlationId,
            "x-instance-id": INSTANCE_ID,
          },
        },
      ],
    });

    const partition = recordMetadata?.[0]?.partition ?? 0;
    const baseOffset = recordMetadata?.[0]?.baseOffset ?? "0";

    console.log(
      `[${INSTANCE_ID}][Trace:${correlationId}] Event published -> topic "${TOPICS.SONG_PLAYS}" [Partition ${partition}, Offset ${baseOffset}] for song ${songId}`
    );

    res.status(202).json({
      success: true,
      message: "Play event streamed to Redpanda topic",
      topic: TOPICS.SONG_PLAYS,
      partition,
      offset: baseOffset,
      instanceId: INSTANCE_ID,
      correlationId,
    });
  } catch (error) {
    console.error(`[${INSTANCE_ID}][Trace:${correlationId}] Error streaming play event:`, error.message);
    res.status(503).json({
      success: false,
      message: "Event streaming unavailable",
      error: error.message,
      instanceId: INSTANCE_ID,
      correlationId,
    });
  }
};

export { enqueuePlay };
