import type { Request, Response } from "express";
import { instanceCredentialsSchema } from "@app-disparo/shared";
import { InstanceService } from "../services/instance.service";
import { sendSuccess } from "../utils/response";

const service = new InstanceService();

export class InstanceController {
  async list(req: Request, res: Response) {
    const instances = await service.list(req.user!.id);
    return sendSuccess(res, instances);
  }

  async create(req: Request, res: Response) {
    const input = instanceCredentialsSchema.parse(req.body);
    const instance = await service.create(req.user!.id, input);
    return sendSuccess(res, instance);
  }

  async test(req: Request, res: Response) {
    const status = await service.testConnection(req.user!.id, req.params.id);
    return sendSuccess(res, status);
  }
}
