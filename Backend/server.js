import express from "express";
import cors from "cors";
import "dotenv/config";
import songRouter from "./src/routes/songRoute.js";
import ConnectDB from "./src/config/mongodb.js";
import connectCloudinary from "./src/config/cloudinary.js";
import bodyParser from "body-parser";
import albumRouter from "./src/routes/albumRoutes.js";
import playRouter from "./src/routes/playRoute.js";
import { INSTANCE_ID, redisReady } from "./src/config/redis.js";

const app = express();
const PORT = process.env.PORT || 8000;
ConnectDB();
connectCloudinary();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("X-Instance-Id", INSTANCE_ID);
  next();
});

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
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`Server ${INSTANCE_ID} running on port ${PORT}`);
});
