import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authLimiter } from "../middleware/rate-limit";
import { authenticate } from "../middleware/auth";

const controller = new AuthController();

export const authRouter = Router();

authRouter.post("/login", authLimiter, (req, res, next) =>
  controller.login(req, res).catch(next)
);

authRouter.post("/refresh", (req, res, next) =>
  controller.refresh(req, res).catch(next)
);

authRouter.post("/logout", (req, res, next) =>
  controller.logout(req, res).catch(next)
);

authRouter.get("/me", authenticate, (req, res, next) => controller.me(req, res).catch(next));
