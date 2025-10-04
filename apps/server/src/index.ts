import { createServer } from "http";
import { env } from "./config/env";
import { createApp } from "./app";
import { logger } from "./config/logger";
import { createSocketServer } from "./config/socket";
import { registerWorkers } from "./workers";
import { registerSchedulers } from "./infrastructure/scheduler";
import { prisma } from "./config/prisma";

async function bootstrap() {
  const app = createApp();
  const server = createServer(app);
  createSocketServer(server);
  await registerWorkers();
  registerSchedulers();

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "HTTP server listening");
  });

  const shutdown = async () => {
    logger.info("Shutting down");
    await prisma.$disconnect();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  logger.error({ error }, "Bootstrap failure");
  process.exit(1);
});
