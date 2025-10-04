import type { Request, Response } from "express";
import { campaignCreateSchema } from "@app-disparo/shared";
import { CampaignService } from "../services/campaign.service";
import { sendSuccess } from "../utils/response";
import { parse } from "json2csv";

const service = new CampaignService();

export class CampaignController {
  async list(req: Request, res: Response) {
    const campaigns = await service.list(req.user!.id);
    return sendSuccess(res, campaigns);
  }

  async get(req: Request, res: Response) {
    const campaign = await service.get(req.user!.id, req.params.id);
    return sendSuccess(res, campaign);
  }

  async create(req: Request, res: Response) {
    const dto = campaignCreateSchema.parse(req.body);
    const campaign = await service.create(req.user!.id, dto);
    return sendSuccess(res, campaign);
  }

  async start(req: Request, res: Response) {
    const campaign = await service.start(req.user!.id, req.params.id);
    return sendSuccess(res, campaign);
  }

  async pause(req: Request, res: Response) {
    await service.pause(req.user!.id, req.params.id);
    return sendSuccess(res, true);
  }

  async resume(req: Request, res: Response) {
    await service.resume(req.user!.id, req.params.id);
    return sendSuccess(res, true);
  }

  async progress(req: Request, res: Response) {
    await service.progress(req.user!.id, req.params.id);
    return sendSuccess(res, true);
  }

  async report(req: Request, res: Response) {
    const data = await service.getReport(req.user!.id, req.params.id);
    const format = (req.query.format as string) ?? "json";

    if (format === "csv") {
      const csv = parse(data);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=relatorio-${req.params.id}.csv`);
      return res.send(csv);
    }

    return sendSuccess(res, data);
  }
}
