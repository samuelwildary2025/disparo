import type { Request, Response } from "express";
import { blacklistSchema } from "@app-disparo/shared";
import { BlacklistService } from "../services/blacklist.service";
import { sendSuccess } from "../utils/response";
import { normalizePhoneNumber } from "../utils/phone";

const service = new BlacklistService();

export class BlacklistController {
  async list(req: Request, res: Response) {
    const entries = await service.list(req.user!.id);
    return sendSuccess(res, entries);
  }

  async add(req: Request, res: Response) {
    const payload = blacklistSchema.parse(req.body);
    const normalized = normalizePhoneNumber(payload.phoneNumber);
    const entry = await service.add(req.user!.id, normalized, payload.reason);
    return sendSuccess(res, entry);
  }

  async remove(req: Request, res: Response) {
    const normalized = normalizePhoneNumber(req.params.phoneNumber);
    await service.remove(req.user!.id, normalized);
    return sendSuccess(res, true);
  }
}
