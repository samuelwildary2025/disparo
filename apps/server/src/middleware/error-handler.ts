import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error";
import { logger } from "../config/logger";
import { sendError } from "../utils/response";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    logger.warn({ err }, "app error");
    return sendError(res, err.statusCode, err.message, {
      details: err.details
    });
  }

  if (err instanceof ZodError) {
    logger.warn({ err }, "validation error");
    return sendError(res, 422, "Dados inválidos", {
      issues: err.issues
    });
  }

  logger.error({ err }, "unexpected error");
  return sendError(res, 500, "Erro interno do servidor");
}
