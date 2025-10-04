import { add } from "date-fns";
import createHttpError from "http-errors";
import { prisma } from "../config/prisma";
import { comparePassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwt";
import { logger } from "../config/logger";

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createHttpError(401, "Credenciais inválidas");
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw createHttpError(401, "Credenciais inválidas");
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role });

    const expiresAt = add(new Date(), { days: 7 });

    await prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = verifyToken<{ sub: string; role: string; type: string }>(refreshToken);
      if (payload.type !== "refresh") {
        throw createHttpError(401, "Token inválido");
      }

      const session = await prisma.session.findUnique({ where: { token: refreshToken } });
      if (!session || session.expiresAt < new Date()) {
        throw createHttpError(401, "Sessão expirada");
      }

      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        throw createHttpError(401, "Usuário não encontrado");
      }

      const accessToken = signAccessToken({ sub: user.id, role: user.role });
      const newRefresh = signRefreshToken({ sub: user.id, role: user.role });

      await prisma.session.update({
        where: { token: refreshToken },
        data: {
          token: newRefresh,
          expiresAt: add(new Date(), { days: 7 })
        }
      });

      return {
        accessToken,
        refreshToken: newRefresh
      };
    } catch (error) {
      logger.warn({ error }, "refresh token failure");
      throw createHttpError(401, "Não autorizado");
    }
  }

  async logout(refreshToken: string) {
    await prisma.session.deleteMany({ where: { token: refreshToken } });
  }
}
