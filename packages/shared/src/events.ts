import type { CampaignProgress, DispatchEvent, EvolutionConnectionTest } from "./types";

export type ServerToClientEvents = {
  dispatch_event: (event: DispatchEvent) => void;
  campaign_progress: (progress: CampaignProgress) => void;
  evolution_status: (status: EvolutionConnectionTest) => void;
  notification: (payload: { type: "info" | "warning" | "error"; message: string }) => void;
};

export type ClientToServerEvents = {
  subscribe_campaign: (campaignId: string) => void;
  unsubscribe_campaign: (campaignId: string) => void;
};

export const SOCKET_EVENTS = {
  DISPATCH_EVENT: "dispatch_event",
  CAMPAIGN_PROGRESS: "campaign_progress",
  EVOLUTION_STATUS: "evolution_status",
  NOTIFICATION: "notification",
  SUBSCRIBE_CAMPAIGN: "subscribe_campaign",
  UNSUBSCRIBE_CAMPAIGN: "unsubscribe_campaign"
} as const;
