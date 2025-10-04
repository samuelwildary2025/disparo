import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { sendSuccess } from "../utils/response";
import { loginSchema } from "@app-disparo/shared";
import { prisma } from "../config/prisma";

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);

    res
      .cookie("refresh_token", result.tokens.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .cookie("access_token", result.tokens.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 15 * 60 * 1000
      });

    return sendSuccess(res, result.user, {
      accessToken: result.tokens.accessToken
    });
  }

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.refresh_token ?? req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, error: "Refresh token ausente" });
    }
    const result = await authService.refresh(token);

    res
      .cookie("refresh_token", result.refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000
      })
      .cookie("access_token", result.accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 15 * 60 * 1000
      });

    return sendSuccess(res, null, {
      accessToken: result.accessToken
    });
  }

  async logout(req: Request, res: Response) {
    const token = req.cookies?.refresh_token ?? req.body?.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie("refresh_token");
    res.clearCookie("access_token");
    return sendSuccess(res, true);
  }

  async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Não autenticado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    return sendSuccess(res, user);
  }
}
