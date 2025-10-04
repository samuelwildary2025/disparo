import { PrismaClient, Prisma } from "@prisma/client";
import { logger } from "./logger";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "stdout", level: "error" },
      { emit: "stdout", level: "warn" }
    ] satisfies Prisma.LogDefinition[]
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
