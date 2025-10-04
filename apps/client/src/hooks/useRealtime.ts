import { useEffect } from "react";
import type { CampaignProgress, DispatchEvent, EvolutionConnectionTest } from "@app-disparo/shared";
import { getSocket } from "../providers/socket";
import { useAuth } from "../store/auth";

interface Options {
  campaignId?: string;
  onDispatchEvent?: (event: DispatchEvent) => void;
  onProgress?: (progress: CampaignProgress) => void;
  onEvolution?: (status: EvolutionConnectionTest) => void;
}

export function useRealtime(options: Options) {
  const { user } = useAuth();
  const { campaignId, onDispatchEvent, onProgress, onEvolution } = options;

  useEffect(() => {
    if (!user) {
      return;
    }

    const socket = getSocket(user.id);

    if (campaignId) {
      socket.emit("subscribe_campaign", campaignId);
    }

    const dispatchHandler = (event: DispatchEvent) => {
      if (onDispatchEvent && (!campaignId || event.campaignId === campaignId)) {
        onDispatchEvent(event);
      }
    };

    const progressHandler = (progress: CampaignProgress) => {
      if (onProgress && (!campaignId || progress.campaignId === campaignId)) {
        onProgress(progress);
      }
    };

    const evolutionHandler = (status: EvolutionConnectionTest) => {
      onEvolution?.(status);
    };

    socket.on("dispatch_event", dispatchHandler);
    socket.on("campaign_progress", progressHandler);
    socket.on("evolution_status", evolutionHandler);

    return () => {
      if (campaignId) {
        socket.emit("unsubscribe_campaign", campaignId);
      }
      socket.off("dispatch_event", dispatchHandler);
      socket.off("campaign_progress", progressHandler);
      socket.off("evolution_status", evolutionHandler);
    };
  }, [user, campaignId, onDispatchEvent, onProgress, onEvolution]);
}
