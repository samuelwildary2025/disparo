import { Router } from "express";
import { ConfigController } from "../controllers/config.controller";

const controller = new ConfigController();

export const configRouter = Router();

configRouter.post("/openai/test", (req, res, next) => controller.testOpenAI(req, res).catch(next));
configRouter.post("/evolution/test", (req, res, next) => controller.testEvolution(req, res).catch(next));
