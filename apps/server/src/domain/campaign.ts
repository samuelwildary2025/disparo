import type { AntiBanState } from "../utils/anti-ban";

export interface CampaignSettings {
  antiBanState: AntiBanState;
}

export function defaultCampaignSettings(): CampaignSettings {
  return {
    antiBanState: {
      messagesSent: 0,
      dailyCount: 0
    }
  };
}
