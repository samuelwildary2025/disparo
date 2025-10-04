import { Queue, QueueEvents } from "bullmq";
import type { DispatchJobData } from "./types";
import { getRedis } from "../config/redis";
import { logger } from "../config/logger";

const connection = getRedis();

const queueName = "dispatch";

export const dispatchQueue = new Queue<DispatchJobData>(queueName, {
  connection
});

export const dispatchQueueEvents = new QueueEvents(queueName, {
  connection
});

dispatchQueueEvents.on("failed", ({ jobId, failedReason }) => {
  logger.error({ jobId, failedReason }, "dispatch job failed");
});

dispatchQueueEvents.on("completed", ({ jobId }) => {
  logger.debug({ jobId }, "dispatch job completed");
});

export async function enqueueDispatchJob(data: DispatchJobData, delay = 0) {
  await dispatchQueue.add(
    "dispatch",
    data,
    {
      removeOnComplete: 1000,
      removeOnFail: 5000,
      delay
    }
  );
}
