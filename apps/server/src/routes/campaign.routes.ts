import { Router } from "express";
import { CampaignController } from "../controllers/campaign.controller";

const controller = new CampaignController();

export const campaignRouter = Router();

campaignRouter.get("/", (req, res, next) => controller.list(req, res).catch(next));
campaignRouter.post("/", (req, res, next) => controller.create(req, res).catch(next));
campaignRouter.get("/:id", (req, res, next) => controller.get(req, res).catch(next));
campaignRouter.post("/:id/start", (req, res, next) => controller.start(req, res).catch(next));
campaignRouter.post("/:id/pause", (req, res, next) => controller.pause(req, res).catch(next));
campaignRouter.post("/:id/resume", (req, res, next) => controller.resume(req, res).catch(next));
campaignRouter.get("/:id/progress", (req, res, next) => controller.progress(req, res).catch(next));
campaignRouter.get("/:id/report", (req, res, next) => controller.report(req, res).catch(next));
