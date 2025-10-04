import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { EvolutionClient } from "../integrations/evolution.client";
import type { EvolutionConnectionTest } from "@app-disparo/shared";

interface InstanceInput {
  name: string;
  evolutionUrl: string;
  apiKey: string;
}

export class InstanceService {
  async create(userId: string, input: InstanceInput) {
    const instance = await prisma.whatsAppInstance.create({
      data: {
        userId,
        name: input.name,
        evolutionUrl: input.evolutionUrl,
        apiKey: input.apiKey,
        status: "disconnected"
      }
    });

    return instance;
  }

  async list(userId: string) {
    return prisma.whatsAppInstance.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async testConnection(userId: string, instanceId: string): Promise<EvolutionConnectionTest> {
    const instance = await prisma.whatsAppInstance.findFirst({
      where: { id: instanceId, userId }
    });

    if (!instance) {
      throw new AppError("Instância não encontrada", 404);
    }

    const client = new EvolutionClient({
      id: instance.id,
      apiKey: instance.apiKey,
      evolutionUrl: instance.evolutionUrl
    });

    const result = await client.validateConnection();

    await prisma.whatsAppInstance.update({
      where: { id: instance.id },
      data: {
        status: result.status
      }
    });

    return result;
  }
}
