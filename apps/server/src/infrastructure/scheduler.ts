import cron from "node-cron";
import { prisma } from "../config/prisma";
import { CampaignService } from "../services/campaign.service";
import { logger } from "../config/logger";

export function registerSchedulers() {
  const campaignService = new CampaignService();

  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const campaigns = await prisma.campaign.findMany({
      where: {
        status: "scheduled",
        scheduleAt: {
          lte: now
        }
      }
    });

    for (const campaign of campaigns) {
      try {
        await campaignService.start(campaign.userId, campaign.id);
        logger.info({ campaignId: campaign.id }, "campanha agendada iniciada");
      } catch (error) {
        logger.error({ error, campaignId: campaign.id }, "falha ao iniciar campanha agendada");
      }
    }
  });
}
