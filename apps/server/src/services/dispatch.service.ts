import type { DispatchStatus } from "@app-disparo/shared";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { enqueueDispatchJob } from "../queue/dispatch-queue";
import type { DispatchJobData } from "../queue/types";
import { RealtimeService } from "./realtime.service";
import { randomInt } from "crypto";

export class DispatchService {
  private readonly realtime = new RealtimeService();

  async enqueueCampaignDispatches(campaignId: string) {
    await this.scheduleInitialSteps(campaignId);
  }

  private computeStepDelayMs(step: { delayMinSeconds: number; delayMaxSeconds: number }) {
    const min = Math.max(step.delayMinSeconds, 0);
    const max = Math.max(step.delayMaxSeconds, min);
    if (max === min) {
      return min * 1000;
    }
    return randomInt(min, max + 1) * 1000;
  }

  private async scheduleInitialSteps(campaignId: string) {
    const campaignSteps = await prisma.campaignStep.findMany({
      where: { campaignId },
      orderBy: { order: "asc" }
    });

    if (campaignSteps.length === 0) {
      return;
    }

    const dispatchesWithoutSteps = await prisma.messageDispatch.findMany({
      where: {
        campaignId,
        steps: {
          none: {}
        }
      },
      select: { id: true }
    });

    if (dispatchesWithoutSteps.length > 0) {
      const data = dispatchesWithoutSteps.flatMap((dispatch) =>
        campaignSteps.map((step) => ({
          dispatchId: dispatch.id,
          campaignStepId: step.id,
          status: "pending" as const
        }))
      );

      if (data.length > 0) {
        await prisma.dispatchStep.createMany({ data, skipDuplicates: true });
      }
    }

    const steps = await prisma.dispatchStep.findMany({
      where: {
        dispatch: {
          campaignId,
          status: {
            in: ["pending", "processing"]
          }
        },
        status: "pending",
        scheduledAt: null
      },
      include: {
        campaignStep: true,
        dispatch: {
          select: {
            id: true,
            campaignId: true,
            attemptCount: true
          }
        }
      },
      orderBy: [
        {
          campaignStep: {
            order: "asc"
          }
        },
        {
          createdAt: "asc"
        }
      ]
    });

    const scheduled = new Set<string>();

    await Promise.all(
      steps.map(async (step, index) => {
        if (scheduled.has(step.dispatchId)) {
          return;
        }
        scheduled.add(step.dispatchId);

        const delay = this.computeStepDelayMs(step.campaignStep) + index * 250;
        await this.rescheduleStep(step.id, delay);

        const job: DispatchJobData = {
          campaignId,
          dispatchId: step.dispatch.id,
          campaignStepId: step.campaignStepId,
          dispatchStepId: step.id,
          stepOrder: step.campaignStep.order,
          attempt: step.dispatch.attemptCount + 1
        };

        await enqueueDispatchJob(job, delay);
      })
    );
  }

  async scheduleNextStep(dispatchId: string, currentOrder: number) {
    const nextStep = await prisma.dispatchStep.findFirst({
      where: {
        dispatchId,
        status: "pending",
        scheduledAt: null,
        campaignStep: {
          order: currentOrder + 1
        }
      },
      include: {
        campaignStep: true,
        dispatch: {
          select: {
            id: true,
            campaignId: true,
            attemptCount: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (!nextStep) {
      return null;
    }

    const delay = this.computeStepDelayMs(nextStep.campaignStep);
    const scheduleAt = new Date(Date.now() + delay);

    await prisma.dispatchStep.update({
      where: { id: nextStep.id },
      data: {
        scheduledAt: scheduleAt
      }
    });

    await enqueueDispatchJob(
      {
        campaignId: nextStep.dispatch.campaignId,
        dispatchId: nextStep.dispatchId,
        campaignStepId: nextStep.campaignStepId,
        dispatchStepId: nextStep.id,
        stepOrder: nextStep.campaignStep.order,
        attempt: nextStep.dispatch.attemptCount + 1
      },
      delay
    );

    return nextStep;
  }

  async rescheduleStep(dispatchStepId: string, delayMs: number) {
    const scheduleAt = new Date(Date.now() + delayMs);
    await prisma.dispatchStep.update({
      where: { id: dispatchStepId },
      data: {
        scheduledAt: scheduleAt
      }
    });
  }

  async getDispatchStepContext(dispatchStepId: string) {
    return prisma.dispatchStep.findUnique({
      where: { id: dispatchStepId },
      include: {
        campaignStep: {
          include: {
            template: true,
            campaign: {
              include: {
                instance: true,
                template: true,
                steps: {
                  orderBy: { order: "asc" }
                }
              }
            }
          }
        },
        dispatch: {
          include: {
            contact: true
          }
        }
      }
    });
  }

  async emitProgress(campaignId: string) {
    const [total, success, failed, processing, campaign] = await Promise.all([
      prisma.messageDispatch.count({ where: { campaignId } }),
      prisma.messageDispatch.count({ where: { campaignId, status: "success" } }),
      prisma.messageDispatch.count({ where: { campaignId, status: "failed" } }),
      prisma.messageDispatch.count({ where: { campaignId, status: "processing" } }),
      prisma.campaign.findUnique({ where: { id: campaignId } })
    ]);

    if (!campaign) {
      return;
    }

    this.realtime.emitCampaignProgress({
      campaignId,
      total,
      completed: success,
      failed,
      inFlight: processing,
      status: campaign.status
    });
  }

  async emitDispatchEvent(dispatchId: string) {
    const dispatch = await prisma.messageDispatch.findUnique({
      where: { id: dispatchId },
      include: {
        campaign: true,
        contact: true
      }
    });

    if (!dispatch) {
      return;
    }

    this.realtime.emitDispatchEvent({
      dispatchId: dispatch.id,
      campaignId: dispatch.campaignId,
      contactId: dispatch.contactId,
      status: dispatch.status,
      message: dispatch.messageBody ?? undefined,
      error: dispatch.errorMessage ?? undefined,
      attempt: dispatch.attemptCount,
      timestamp: dispatch.updatedAt.toISOString()
    });
  }

  async setStatus(dispatchId: string, status: DispatchStatus, data?: Partial<{ message: string; error: string }>) {
    await prisma.messageDispatch.update({
      where: { id: dispatchId },
      data: {
        status,
        messageBody: data?.message,
        errorMessage: data?.error,
        completedAt: status === "success" ? new Date() : undefined
      }
    });

    await this.emitDispatchEvent(dispatchId);
  }

  async incrementAttempt(dispatchId: string) {
    await prisma.messageDispatch.update({
      where: { id: dispatchId },
      data: {
        attemptCount: {
          increment: 1
        },
        lastAttemptAt: new Date()
      }
    });
  }

  async addLog(dispatchId: string, status: DispatchStatus, detail?: string, payload?: unknown) {
    await prisma.dispatchLog.create({
      data: {
        dispatchId,
        status,
        detail,
        payload: payload ? (payload as object) : undefined
      }
    });
  }

  async setStepStatus(
    dispatchStepId: string,
    status: DispatchStatus,
    data?: Partial<{ error: string; payload: unknown }>
  ) {
    const updateData: Prisma.DispatchStepUpdateInput = {
      status,
      sentAt:
        status === "success" ? new Date() : status === "pending" ? null : undefined,
      completedAt:
        ["success", "failed", "cancelled"].includes(status)
          ? new Date()
          : status === "pending"
          ? null
          : undefined,
      errorMessage: status === "pending" ? null : data?.error
    };

    if (status === "pending") {
      updateData.payload = Prisma.JsonNull;
    } else if (data?.payload !== undefined) {
      updateData.payload = data.payload as Prisma.InputJsonValue;
    }

    await prisma.dispatchStep.update({
      where: { id: dispatchStepId },
      data: updateData
    });
  }
}
