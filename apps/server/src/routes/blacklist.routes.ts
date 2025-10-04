import { Router } from "express";
import { BlacklistController } from "../controllers/blacklist.controller";

const controller = new BlacklistController();

export const blacklistRouter = Router();

blacklistRouter.get("/", (req, res, next) => controller.list(req, res).catch(next));
blacklistRouter.post("/", (req, res, next) => controller.add(req, res).catch(next));
blacklistRouter.delete("/:phoneNumber", (req, res, next) => controller.remove(req, res).catch(next));
