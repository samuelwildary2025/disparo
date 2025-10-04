import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { prisma } from "../config/prisma";
import { verifyToken } from "../utils/jwt";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? req.cookies?.access_token;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : header;

    if (!token) {
      throw createHttpError(401, "Credenciais ausentes");
    }

    const payload = verifyToken<{ sub: string; role: string }>(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub }
    });

    if (!user) {
      throw createHttpError(401, "Usuário não encontrado");
    }

    req.user = {
      id: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    next(createHttpError(401, "Token inválido"));
  }
}

export function authorize(roles: string[] = []) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createHttpError(401, "Não autenticado"));
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return next(createHttpError(403, "Sem permissão"));
    }

    return next();
  };
}
