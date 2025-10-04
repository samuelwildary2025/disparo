import { prisma } from "../config/prisma";

export class BlacklistService {
  async add(userId: string, phoneNumber: string, reason?: string) {
    return prisma.blacklistEntry.upsert({
      where: {
        userId_phoneNumber: {
          userId,
          phoneNumber
        }
      },
      update: {
        reason
      },
      create: {
        userId,
        phoneNumber,
        reason
      }
    });
  }

  async isBlacklisted(userId: string, phoneNumber: string) {
    const entry = await prisma.blacklistEntry.findUnique({
      where: {
        userId_phoneNumber: {
          userId,
          phoneNumber
        }
      }
    });
    return Boolean(entry);
  }

  async list(userId: string) {
    return prisma.blacklistEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async remove(userId: string, phoneNumber: string) {
    await prisma.blacklistEntry.delete({
      where: {
        userId_phoneNumber: {
          userId,
          phoneNumber
        }
      }
    });
  }
}
