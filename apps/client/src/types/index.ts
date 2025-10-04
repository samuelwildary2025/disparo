import type { CampaignStatus, DispatchStatus } from "@app-disparo/shared";

export interface CampaignSummary {
  id: string;
  name: string;
  status: CampaignStatus;
  mode: "test" | "live";
  createdAt: string;
  scheduleAt?: string | null;
  contactList: {
    id: string;
    name: string;
    totalCount: number;
  };
  template: {
    id: string;
    name: string;
  };
  instance: {
    id: string;
    name: string;
    status: string;
  };
  steps?: Array<{
    id: string;
    order: number;
    templateId: string;
    delayMinSeconds: number;
    delayMaxSeconds: number;
    waitForReplySeconds?: number | null;
    cancelIfReply: boolean;
    skipIfAutoReply: boolean;
    typingMsOverride?: number | null;
    aiVariation: boolean;
  }>;
}

export interface CampaignDetail extends CampaignSummary {
  dispatches: Array<{
    id: string;
    status: DispatchStatus;
    attemptCount: number;
    contact: {
      id: string;
      name: string;
      phoneNumber: string;
    };
    messageBody?: string | null;
    errorMessage?: string | null;
    updatedAt: string;
    steps?: Array<{
      id: string;
      status: DispatchStatus;
      campaignStepId: string;
      sentAt?: string | null;
      completedAt?: string | null;
    }>;
  }>;
  antiBanConfig: unknown;
}

export interface ContactList {
  id: string;
  name: string;
  description?: string | null;
  totalCount: number;
  isDraft: boolean;
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

export interface Instance {
  id: string;
  name: string;
  evolutionUrl: string;
  status: string;
}
