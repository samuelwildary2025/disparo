import { Router } from "express";
import { TemplateController } from "../controllers/template.controller";

const controller = new TemplateController();

export const templateRouter = Router();

templateRouter.get("/", (req, res, next) => controller.list(req, res).catch(next));
templateRouter.post("/", (req, res, next) => controller.create(req, res).catch(next));
templateRouter.put("/:id", (req, res, next) => controller.update(req, res).catch(next));
