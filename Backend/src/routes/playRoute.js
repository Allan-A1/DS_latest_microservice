import express from "express";
import { enqueuePlay } from "../controllers/playController.js";

const playRouter = express.Router();

playRouter.post("/", enqueuePlay);

export default playRouter;
