import type { Request, Response } from "express";
import { ContactListService } from "../services/contact-list.service";
import { parseContactsCsv } from "../utils/csv";
import { sendSuccess } from "../utils/response";
import { AppError } from "../utils/app-error";

const service = new ContactListService();

export class ContactListController {
  async list(req: Request, res: Response) {
    const lists = await service.list(req.user!.id);
    return sendSuccess(res, lists);
  }

  async get(req: Request, res: Response) {
    const list = await service.get(req.user!.id, req.params.id);
    return sendSuccess(res, list);
  }

  async upload(req: Request, res: Response) {
    const file = req.file;
    if (!file) {
      throw new AppError("Arquivo CSV é obrigatório", 400);
    }

    const csvContent = file.buffer.toString("utf-8");
    const { contacts, errors } = parseContactsCsv(csvContent);

    const list = await service.create({
      userId: req.user!.id,
      name: req.body.name,
      description: req.body.description,
      contacts,
      isDraft: true
    });

    return sendSuccess(res, { list, errors });
  }

  async publish(req: Request, res: Response) {
    const list = await service.publish(req.params.id, req.user!.id);
    return sendSuccess(res, list);
  }

  async removeContact(req: Request, res: Response) {
    await service.removeContact(req.params.id, req.params.contactId, req.user!.id);
    return sendSuccess(res, true);
  }
}
