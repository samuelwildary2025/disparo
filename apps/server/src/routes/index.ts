import { Router } from "express";
import { authRouter } from "./auth.routes";
import { healthRouter } from "./health.routes";
import { authenticate } from "../middleware/auth";
import { campaignRouter } from "./campaign.routes";
import { contactListRouter } from "./contact-list.routes";
import { templateRouter } from "./template.routes";
import { instanceRouter } from "./instance.routes";
import { blacklistRouter } from "./blacklist.routes";
import { configRouter } from "./config.routes";

export const routes = Router();

routes.use("/health", healthRouter);
routes.use("/auth", authRouter);

const protectedRoutes = Router();

protectedRoutes.use("/campaigns", campaignRouter);
protectedRoutes.use("/contact-lists", contactListRouter);
protectedRoutes.use("/templates", templateRouter);
protectedRoutes.use("/instances", instanceRouter);
protectedRoutes.use("/blacklist", blacklistRouter);
protectedRoutes.use("/config", configRouter);

routes.use(authenticate, protectedRoutes);
