import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { extractTemplateVariables } from "@app-disparo/shared";

interface TemplateInput {
  name: string;
  content: string;
}

export class TemplateService {
  async create(userId: string, input: TemplateInput) {
    const variables = extractTemplateVariables(input.content);
    return prisma.messageTemplate.create({
      data: {
        userId,
        name: input.name,
        content: input.content,
        variables
      }
    });
  }

  async update(userId: string, templateId: string, input: TemplateInput) {
    const template = await prisma.messageTemplate.findFirst({
      where: { id: templateId, userId }
    });
    if (!template) {
      throw new AppError("Template não encontrado", 404);
    }
    const variables = extractTemplateVariables(input.content);
    return prisma.messageTemplate.update({
      where: { id: templateId },
      data: {
        name: input.name,
        content: input.content,
        variables
      }
    });
  }

  async list(userId: string) {
    return prisma.messageTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async get(userId: string, templateId: string) {
    const template = await prisma.messageTemplate.findFirst({
      where: { id: templateId, userId }
    });
    if (!template) {
      throw new AppError("Template não encontrado", 404);
    }
    return template;
  }
}
