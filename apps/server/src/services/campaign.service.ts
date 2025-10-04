import type { CampaignCreateDto } from "@app-disparo/shared";
import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/app-error";
import { DispatchService } from "./dispatch.service";
import { defaultCampaignSettings } from "../domain/campaign";

export class CampaignService {
  private readonly dispatchService = new DispatchService();

  async list(userId: string) {
    return prisma.campaign.findMany({
      where: { userId },
      include: {
        contactList: true,
        template: true,
        instance: true,
        steps: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  async get(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId },
      include: {
        contactList: {
          include: {
            contacts: true
          }
        },
        template: true,
        instance: true,
        steps: {
          orderBy: { order: "asc" }
        },
        dispatches: {
          include: {
            contact: true,
            steps: {
              include: {
                campaignStep: true
              },
              orderBy: { campaignStep: { order: "asc" } }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!campaign) {
      throw new AppError("Campanha não encontrada", 404);
    }

    return campaign;
  }

  async create(userId: string, dto: CampaignCreateDto) {
    const stepDefinitions = dto.steps ?? [
      {
        templateId: dto.templateId,
        delayMinSeconds: 0,
        delayMaxSeconds: 0,
        waitForReplySeconds: undefined,
        cancelIfReply: false,
        skipIfAutoReply: false,
        typingMsOverride: undefined,
        aiVariation: true
      }
    ];

    const templateIds = Array.from(new Set([dto.templateId, ...stepDefinitions.map((step) => step.templateId)]));

    const [templates, contactList, instance] = await Promise.all([
      prisma.messageTemplate.findMany({ where: { id: { in: templateIds }, userId } }),
      prisma.contactList.findFirst({
        where: { id: dto.contactListId, userId },
        include: { contacts: true }
      }),
      prisma.whatsAppInstance.findFirst({ where: { id: dto.instanceId, userId } })
    ]);

    if (templates.length !== templateIds.length) {
      throw new AppError("Um ou mais templates não foram encontrados", 404);
    }
    if (!contactList) throw new AppError("Lista de contatos inexistente", 404);
    if (!instance) throw new AppError("Instância não encontrada", 404);

    if (contactList.contacts.length === 0) {
      throw new AppError("Lista sem contatos", 422);
    }

    const sampleSize =
      dto.mode === "test"
        ? Math.min(dto.testSampleSize ?? 10, contactList.contacts.length)
        : contactList.contacts.length;

    const contacts =
      dto.mode === "test"
        ? contactList.contacts.slice(0, sampleSize)
        : contactList.contacts;

    const normalizedSteps = stepDefinitions.map((step, index) => {
      const min = Math.max(step.delayMinSeconds ?? 0, 0);
      const max = Math.max(step.delayMaxSeconds ?? min, min);
      return {
        order: index + 1,
        templateId: step.templateId,
        delayMinSeconds: min,
        delayMaxSeconds: max,
        waitForReplySeconds: step.waitForReplySeconds ?? null,
        cancelIfReply: step.cancelIfReply ?? false,
        skipIfAutoReply: step.skipIfAutoReply ?? false,
        typingMsOverride: step.typingMsOverride ?? null,
        aiVariation: step.aiVariation ?? true
      };
    });

    const primaryTemplateId = normalizedSteps[0]?.templateId ?? dto.templateId;

    const campaignSettingsJson = defaultCampaignSettings() as unknown as Prisma.JsonObject;
    const antiBanJson = dto.antiBan as unknown as Prisma.JsonObject;

    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name: dto.name,
        templateId: primaryTemplateId,
        contactListId: dto.contactListId,
        instanceId: dto.instanceId,
        status: dto.scheduleAt ? "scheduled" : "draft",
        mode: dto.mode,
        testSampleSize: dto.mode === "test" ? sampleSize : null,
        scheduleAt: dto.scheduleAt ? new Date(dto.scheduleAt) : null,
        antiBanConfig: antiBanJson,
        settings: campaignSettingsJson,
        steps: {
          create: normalizedSteps
        }
      },
      include: {
        steps: {
          orderBy: { order: "asc" }
        }
      }
    });

    const campaignSteps = campaign.steps ?? [];

    await prisma.messageDispatch.createMany({
      data: contacts.map((contact) => ({
        campaignId: campaign.id,
        contactId: contact.id,
        status: "pending"
      }))
    });

    const dispatches = await prisma.messageDispatch.findMany({
      where: { campaignId: campaign.id },
      select: { id: true }
    });

    const dispatchStepsData = dispatches.flatMap((dispatch) =>
      campaignSteps.map((step) => ({
        dispatchId: dispatch.id,
        campaignStepId: step.id,
        status: "pending" as const
      }))
    );

    if (dispatchStepsData.length > 0) {
      await prisma.dispatchStep.createMany({ data: dispatchStepsData });
    }

    await prisma.contactList.update({
      where: { id: contactList.id },
      data: { isDraft: false }
    });

    await this.dispatchService.emitProgress(campaign.id);

    return campaign;
  }

  async start(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId }
    });

    if (!campaign) throw new AppError("Campanha não encontrada", 404);
    if (campaign.status === "running") {
      return campaign;
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "running"
      }
    });

    await this.dispatchService.enqueueCampaignDispatches(campaignId);
    await this.dispatchService.emitProgress(campaignId);

    return prisma.campaign.findUnique({ where: { id: campaignId } });
  }

  async pause(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
    if (!campaign) throw new AppError("Campanha não encontrada", 404);

    if (campaign.status !== "running") {
      throw new AppError("Campanha não está em execução", 400);
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "paused"
      }
    });

    await this.dispatchService.emitProgress(campaignId);
    return true;
  }

  async resume(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
    if (!campaign) throw new AppError("Campanha não encontrada", 404);

    if (campaign.status !== "paused") {
      throw new AppError("Campanha não está pausada", 400);
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "running"
      }
    });

    await this.dispatchService.enqueueCampaignDispatches(campaignId);
    await this.dispatchService.emitProgress(campaignId);

    return true;
  }

  async getReport(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId },
      include: {
        dispatches: {
          include: { contact: true }
        }
      }
    });

    if (!campaign) throw new AppError("Campanha não encontrada", 404);

    return campaign.dispatches.map((dispatch) => ({
      contato: dispatch.contact.name,
      telefone: dispatch.contact.phoneNumber,
      status: dispatch.status,
      mensagem: dispatch.messageBody,
      erro: dispatch.errorMessage,
      tentativas: dispatch.attemptCount,
      ultima_tentativa: dispatch.lastAttemptAt?.toISOString() ?? null
    }));
  }

  async progress(userId: string, campaignId: string) {
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId } });
    if (!campaign) throw new AppError("Campanha não encontrada", 404);
    await this.dispatchService.emitProgress(campaignId);
  }
}
