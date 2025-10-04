import { Redis } from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3
    });

    client.on("error", (error) => {
      logger.error({ error }, "redis connection error");
    });

    client.on("connect", () => {
      logger.info("redis connected");
    });
  }

  return client;
}
