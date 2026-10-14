import express from "express";
import cors from "cors";
import crypto from "crypto";
import "dotenv/config";
import songRouter from "./src/routes/songRoute.js";
import ConnectDB from "./src/config/mongodb.js";
import connectCloudinary from "./src/config/cloudinary.js";
import bodyParser from "body-parser";
import albumRouter from "./src/routes/albumRoutes.js";
import playRouter from "./src/routes/playRoute.js";
import { INSTANCE_ID, redisReady } from "./src/config/redis.js";
import { ensureTopics, getProducer, KAFKA_BROKERS } from "./src/config/kafka.js";
import { distributedRateLimiter } from "./src/middleware/rateLimiter.js";

const app = express();
const PORT = process.env.PORT || 8000;
ConnectDB();
connectCloudinary();

// Warm up Kafka topics & producer
ensureTopics().catch((e) => console.warn("[Kafka] Topic init deferred:", e.message));
getProducer().catch((e) => console.warn("[Kafka] Producer warmup deferred:", e.message));

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// Distributed Tracing & Correlation ID Middleware
app.use((req, res, next) => {
  const correlationId =
    req.headers["x-correlation-id"] ||
    req.headers["x-request-id"] ||
    crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader("X-Correlation-Id", correlationId);
  res.setHeader("X-Instance-Id", INSTANCE_ID);

  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[${INSTANCE_ID}][Trace:${correlationId}] ${req.method} ${req.originalUrl} ${res.statusCode} (${ms}ms)`
    );
  });

  next();
});

// Distributed Redis Rate Limiter across replicas
app.use("/api", distributedRateLimiter({ windowSeconds: 60, maxRequests: 120 }));

app.use("/api/song", songRouter);
app.use("/api/album", albumRouter);
app.use("/api/play", playRouter);

app.get("/", (req, res) => {
  res.json({ message: "API working", instanceId: INSTANCE_ID });
});

app.get("/health", async (req, res) => {
  const redis = await redisReady();
  res.json({
    status: redis ? "ok" : "degraded",
    instanceId: INSTANCE_ID,
    redis,
    kafkaBrokers: KAFKA_BROKERS,
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`Server ${INSTANCE_ID} running on port ${PORT}`);
});

