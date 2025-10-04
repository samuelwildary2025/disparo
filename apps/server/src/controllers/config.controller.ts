import type { Request, Response } from "express";
import { sendSuccess } from "../utils/response";
import { MessagePersonalizerService } from "../services/message-personalizer.service";
import { EvolutionClient } from "../integrations/evolution.client";
import { AppError } from "../utils/app-error";

const personalizer = new MessagePersonalizerService();

export class ConfigController {
  async testOpenAI(_req: Request, res: Response) {
    const sample = await personalizer.generate({
      template: "Olá {nome}, esta é uma mensagem de teste da nossa equipe.",
      contact: {
        id: "test",
        name: "Contato",
        phoneNumber: "+5511999999999",
        customFields: {
          empresa: "Empresa Teste"
        }
      }
    });

    return sendSuccess(res, {
      message: sample
    });
  }

  async testEvolution(req: Request, res: Response) {
    const { evolutionUrl, apiKey, instanceId } = req.body;
    if (!evolutionUrl || !apiKey) {
      throw new AppError("URL e API Key são obrigatórios", 400);
    }

    const client = new EvolutionClient({
      id: instanceId ?? "temp",
      evolutionUrl,
      apiKey
    });

    const status = await client.validateConnection();
    return sendSuccess(res, status);
  }
}
