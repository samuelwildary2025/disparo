import { Worker, type Job } from "bullmq";
import { differenceInMilliseconds } from "date-fns";
import type { AntiBanConfig, ContactRecord } from "@app-disparo/shared";
import { getRedis } from "../config/redis";
import { logger } from "../config/logger";
import type { DispatchJobData } from "../queue/types";
import { DispatchService } from "../services/dispatch.service";
import { MessagePersonalizerService } from "../services/message-personalizer.service";
import { BlacklistService } from "../services/blacklist.service";
import { EvolutionClient } from "../integrations/evolution.client";
import { prisma } from "../config/prisma";
import { canSendNow, computeNextDelay, nextAllowedDate } from "../utils/anti-ban";
import { defaultCampaignSettings, type CampaignSettings } from "../domain/campaign";
import { AppError } from "../utils/app-error";
import { enqueueDispatchJob } from "../queue/dispatch-queue";

const dispatchService = new DispatchService();
const personalizer = new MessagePersonalizerService();
const blacklistService = new BlacklistService();

const MAX_ATTEMPTS = 3;

async function processJob(job: Job<DispatchJobData>) {
  const stepContext = await dispatchService.getDispatchStepContext(job.data.dispatchStepId);
  if (!stepContext) {
    logger.warn({ dispatchStepId: job.data.dispatchStepId }, "dispatch step not found");
    return;
  }

  const { dispatch, campaignStep } = stepContext;
  const campaign = campaignStep.campaign;

  if (dispatch.status === "failed" || dispatch.status === "cancelled") {
    logger.info({ dispatchId: dispatch.id, status: dispatch.status }, "dispatch already finalized");
    return;
  }

  if (campaign.status !== "running") {
    logger.info({ campaignId: campaign.id, status: campaign.status }, "campaign not runnable, requeue later");
    const delay = 5 * 60 * 1000;
    await dispatchService.rescheduleStep(job.data.dispatchStepId, delay);
    await enqueueDispatchJob(job.data, delay);
    return;
  }

  const antiBanConfig = campaign.antiBanConfig as unknown as AntiBanConfig;
  const settings = (campaign.settings as CampaignSettings | null) ?? defaultCampaignSettings();
  const antiBanState = settings.antiBanState ?? defaultCampaignSettings().antiBanState;

  const now = new Date();
  const attemptNumber = job.data.attempt ?? 1;
  const lastSentAtDate = antiBanState.lastSentAt ? new Date(antiBanState.lastSentAt) : null;
  const isSameDay = lastSentAtDate ? lastSentAtDate.toDateString() === now.toDateString() : false;
  const dailyCountToday = isSameDay ? antiBanState.dailyCount : 0;
  const nextAvailableAtDate = antiBanState.nextAvailableAt ? new Date(antiBanState.nextAvailableAt) : null;

  if (dailyCountToday >= antiBanConfig.dailyLimit) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const nextWindow = nextAllowedDate(antiBanConfig, tomorrow);
    const delay = Math.max(differenceInMilliseconds(nextWindow, now), 60 * 60 * 1000);
    await dispatchService.rescheduleStep(job.data.dispatchStepId, delay);
    await enqueueDispatchJob(job.data, delay);
    return;
  }

  if (nextAvailableAtDate && nextAvailableAtDate > now) {
    const delay = Math.max(differenceInMilliseconds(nextAvailableAtDate, now), 5_000);
    await dispatchService.rescheduleStep(job.data.dispatchStepId, delay);
    await enqueueDispatchJob(job.data, delay);
    return;
  }

  const normalizedState = {
    ...antiBanState,
    dailyCount: dailyCountToday
  };

  if (!canSendNow(antiBanConfig, now, normalizedState)) {
    const nextWindow = nextAllowedDate(antiBanConfig, now);
    const delay = Math.max(differenceInMilliseconds(nextWindow, now), 10_000);
    await dispatchService.rescheduleStep(job.data.dispatchStepId, delay);
    await enqueueDispatchJob(job.data, delay);
    return;
  }

  const isBlacklisted = await blacklistService.isBlacklisted(campaign.userId, dispatch.contact.phoneNumber);
  if (isBlacklisted) {
    await dispatchService.setStepStatus(job.data.dispatchStepId, "cancelled", { error: "Número em blacklist" });
    await dispatchService.setStatus(dispatch.id, "cancelled", { error: "Número em blacklist" });
    await dispatchService.addLog(dispatch.id, "cancelled", "Número em blacklist");
    await maybeCompleteCampaign(campaign.id);
    await dispatchService.emitProgress(campaign.id);
    return;
  }

  if (dispatch.status === "pending") {
    await dispatchService.setStatus(dispatch.id, "processing");
  }

  await dispatchService.incrementAttempt(dispatch.id);
  await dispatchService.setStepStatus(job.data.dispatchStepId, "processing");
  await dispatchService.addLog(dispatch.id, "processing", `Enviando passo ${campaignStep.order}`);

  const contactRecord: ContactRecord = {
    id: dispatch.contact.id,
    name: dispatch.contact.name,
    phoneNumber: dispatch.contact.phoneNumber,
    customFields: (dispatch.contact.customFields as Record<string, string>) ?? {}
  };

  try {
    const personalised = await personalizer.generate({
      template: campaignStep.template.content,
      contact: contactRecord,
      useAi: campaignStep.aiVariation !== false
    });

    const simulateTyping = campaignStep.typingMsOverride ?? Math.min(5000, personalised.length * 120);
    const client = new EvolutionClient({
      id: campaign.instanceId,
      evolutionUrl: campaign.instance.evolutionUrl,
      apiKey: campaign.instance.apiKey
    });

    await client.sendMessage({
      to: contactRecord.phoneNumber,
      message: personalised,
      simulateTypingMs: simulateTyping
    });

    await dispatchService.setStepStatus(job.data.dispatchStepId, "success", {
      payload: {
        message: personalised
      }
    });

    const nowSent = new Date();
    const messagesSent = antiBanState.messagesSent + 1;
    const dailyCount = dailyCountToday + 1;
    const delayResult = computeNextDelay(antiBanConfig, {
      messagesSent,
      dailyCount,
      lastSentAt: nowSent.toISOString(),
      lastLongPauseAt: antiBanState.lastLongPauseAt,
      nextAvailableAt: undefined
    });

    const nextAvailableAt = new Date(nowSent.getTime() + delayResult.totalDelayMs);

    const updatedState = {
      messagesSent,
      dailyCount,
      lastSentAt: nowSent.toISOString(),
      lastLongPauseAt:
        delayResult.longPauseMs > 0 ? nextAvailableAt.toISOString() : antiBanState.lastLongPauseAt,
      nextAvailableAt: nextAvailableAt.toISOString()
    };

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        settings: {
          ...settings,
          antiBanState: updatedState
        }
      }
    });

    const totalSteps = campaign.steps.length;
    if (job.data.stepOrder >= totalSteps) {
      await dispatchService.setStatus(dispatch.id, "success", { message: personalised });
      await dispatchService.addLog(dispatch.id, "success", "Fluxo concluído");
      await maybeCompleteCampaign(campaign.id);
    } else {
      await dispatchService.scheduleNextStep(dispatch.id, job.data.stepOrder);
      await dispatchService.addLog(dispatch.id, "processing", `Passo ${campaignStep.order} concluído`);
    }

    await dispatchService.emitDispatchEvent(dispatch.id);
    await dispatchService.emitProgress(campaign.id);
  } catch (error) {
    const message = error instanceof AppError ? error.message : (error as Error).message;
    await dispatchService.setStepStatus(job.data.dispatchStepId, "failed", { error: message });
    await dispatchService.addLog(dispatch.id, "failed", message);

    const attempts = attemptNumber;
    if (attempts < MAX_ATTEMPTS) {
      const retryDelay = Math.pow(2, attempts) * 1000;
      await dispatchService.setStatus(dispatch.id, "pending");
      await dispatchService.rescheduleStep(job.data.dispatchStepId, retryDelay);
      await enqueueDispatchJob(
        {
          campaignId: job.data.campaignId,
          dispatchId: job.data.dispatchId,
          campaignStepId: job.data.campaignStepId,
          dispatchStepId: job.data.dispatchStepId,
          stepOrder: job.data.stepOrder,
          attempt: attempts + 1
        },
        retryDelay
      );
      await dispatchService.setStepStatus(job.data.dispatchStepId, "pending");
    } else {
      await dispatchService.setStatus(dispatch.id, "failed", { error: message });
      await maybeFailCampaign(campaign.id);
    }

    await dispatchService.emitDispatchEvent(dispatch.id);
    await dispatchService.emitProgress(campaign.id);
  }
}

async function maybeCompleteCampaign(campaignId: string) {
  const [total, done, failures] = await Promise.all([
    prisma.messageDispatch.count({ where: { campaignId } }),
    prisma.messageDispatch.count({
      where: {
        campaignId,
        status: {
          in: ["success", "failed", "cancelled"]
        }
      }
    }),
    prisma.messageDispatch.count({ where: { campaignId, status: "failed" } })
  ]);

  if (total > 0 && total === done && failures === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "completed"
      }
    });
  }
}

async function maybeFailCampaign(campaignId: string) {
  const failures = await prisma.messageDispatch.count({ where: { campaignId, status: "failed" } });
  if (failures > 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "failed"
      }
    });
  }
}

export async function registerWorkers() {
  const worker = new Worker<DispatchJobData>(
    "dispatch",
    async (job) => {
      await processJob(job);
    },
    {
      connection: getRedis(),
      concurrency: 1
    }
  );

  worker.on("error", (err) => {
    logger.error({ err }, "dispatch worker error");
  });

  return worker;
}
