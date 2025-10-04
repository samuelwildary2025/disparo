import { Router } from "express";
import { InstanceController } from "../controllers/instance.controller";

const controller = new InstanceController();

export const instanceRouter = Router();

instanceRouter.get("/", (req, res, next) => controller.list(req, res).catch(next));
instanceRouter.post("/", (req, res, next) => controller.create(req, res).catch(next));
instanceRouter.post("/:id/test", (req, res, next) => controller.test(req, res).catch(next));
