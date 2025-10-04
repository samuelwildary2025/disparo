import type { Response } from "express";
import type { ApiResponse } from "@app-disparo/shared";

export function sendSuccess<T>(res: Response, data: T, meta?: Record<string, unknown>) {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    meta
  };
  return res.json(payload);
}

export function sendError(res: Response, status: number, error: string, meta?: Record<string, unknown>) {
  const payload: ApiResponse<never> = {
    success: false,
    error,
    meta
  };
  return res.status(status).json(payload);
}
