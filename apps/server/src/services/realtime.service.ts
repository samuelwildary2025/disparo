import type { DispatchEvent, CampaignProgress, EvolutionConnectionTest } from "@app-disparo/shared";
import { SOCKET_EVENTS } from "@app-disparo/shared";
import { getSocketServer } from "../config/socket";

export class RealtimeService {
  emitDispatchEvent(event: DispatchEvent) {
    const io = getSocketServer();
    io.to(`campaign:${event.campaignId}`).emit(SOCKET_EVENTS.DISPATCH_EVENT, event);
  }

  emitCampaignProgress(progress: CampaignProgress) {
    const io = getSocketServer();
    io.to(`campaign:${progress.campaignId}`).emit(
      SOCKET_EVENTS.CAMPAIGN_PROGRESS,
      progress
    );
  }

  emitNotification(userId: string, message: string, type: "info" | "warning" | "error" = "info") {
    const io = getSocketServer();
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION, { type, message });
  }

  emitEvolutionStatus(status: EvolutionConnectionTest) {
    const io = getSocketServer();
    io.emit(SOCKET_EVENTS.EVOLUTION_STATUS, status);
  }
}
