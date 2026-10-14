import { Kafka, logLevel } from "kafkajs";

const INSTANCE_ID = process.env.INSTANCE_ID || "local";
const rawBrokers = process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || "redpanda:29092";
const KAFKA_BROKERS = rawBrokers.split(",").map((b) => b.trim());

export const TOPICS = {
  SONG_PLAYS: "song-plays",
};

export const CONSUMER_GROUPS = {
  PLAY_WORKERS: "playcount-workers",
};

let kafka = null;
let producer = null;

export function getKafka() {
  if (!kafka) {
    kafka = new Kafka({
      clientId: `spotify-${INSTANCE_ID}`,
      brokers: KAFKA_BROKERS,
      logLevel: logLevel.WARN,
      retry: {
        initialRetryTime: 300,
        maxRetryTime: 30000,
        retries: 8,
      },
    });
  }
  return kafka;
}

export async function getProducer() {
  if (!producer) {
    const k = getKafka();
    producer = k.producer({
      allowAutoTopicCreation: true,
    });
    await producer.connect();
    console.log(`[Kafka/Redpanda] Producer connected (${INSTANCE_ID}) -> ${KAFKA_BROKERS.join(",")}`);
  }
  return producer;
}

export function createConsumer(groupId = CONSUMER_GROUPS.PLAY_WORKERS) {
  const k = getKafka();
  return k.consumer({
    groupId,
    retry: {
      initialRetryTime: 500,
      maxRetryTime: 30000,
      retries: 10,
    },
  });
}

export async function ensureTopics() {
  try {
    const k = getKafka();
    const admin = k.admin();
    await admin.connect();
    const topics = await admin.listTopics();
    if (!topics.includes(TOPICS.SONG_PLAYS)) {
      await admin.createTopics({
        topics: [
          {
            topic: TOPICS.SONG_PLAYS,
            numPartitions: 3,
            replicationFactor: 1,
          },
        ],
      });
      console.log(`[Kafka/Redpanda] Created topic "${TOPICS.SONG_PLAYS}" with 3 partitions`);
    } else {
      console.log(`[Kafka/Redpanda] Topic "${TOPICS.SONG_PLAYS}" already exists`);
    }
    await admin.disconnect();
  } catch (err) {
    console.warn(`[Kafka/Redpanda] ensureTopics warning: ${err.message}`);
  }
}

export { KAFKA_BROKERS };
