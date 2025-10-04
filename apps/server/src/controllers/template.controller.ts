import type { Request, Response } from "express";
import { messageTemplateSchema } from "@app-disparo/shared";
import { TemplateService } from "../services/template.service";
import { sendSuccess } from "../utils/response";

const service = new TemplateService();

export class TemplateController {
  async list(req: Request, res: Response) {
    const templates = await service.list(req.user!.id);
    return sendSuccess(res, templates);
  }

  async create(req: Request, res: Response) {
    const input = messageTemplateSchema.parse(req.body);
    const template = await service.create(req.user!.id, input);
    return sendSuccess(res, template);
  }

  async update(req: Request, res: Response) {
    const input = messageTemplateSchema.parse(req.body);
    const template = await service.update(req.user!.id, req.params.id, input);
    return sendSuccess(res, template);
  }
}
