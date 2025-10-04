export type Role = "owner" | "manager" | "operator";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "failed";

export type DispatchStatus =
  | "pending"
  | "processing"
  | "success"
  | "failed"
  | "cancelled";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export interface TimeWindow {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface AntiBanConfig {
  minIntervalSeconds: number;
  maxIntervalSeconds: number;
  longPauseEvery: number; // messages
  longPauseMinSeconds: number;
  longPauseMaxSeconds: number;
  dailyLimit: number;
  allowedWindows: TimeWindow[];
}

export interface CampaignConfig {
  name: string;
  templateId: string;
  contactListId: string;
  instanceId: string;
  scheduleAt?: string;
  antiBan: AntiBanConfig;
  mode: "test" | "live";
  testSampleSize?: number;
  steps?: CampaignStepConfig[];
}

export interface CampaignStepConfig {
  templateId: string;
  delayMinSeconds?: number;
  delayMaxSeconds?: number;
  waitForReplySeconds?: number;
  cancelIfReply?: boolean;
  skipIfAutoReply?: boolean;
  typingMsOverride?: number;
  aiVariation?: boolean;
}

export interface CampaignStepRuntime extends CampaignStepConfig {
  id: string;
  order: number;
}

export interface ContactRecord {
  id: string;
  name: string;
  phoneNumber: string;
  customFields: Record<string, string>;
}

export interface DispatchEvent {
  dispatchId: string;
  campaignId: string;
  contactId: string;
  status: DispatchStatus;
  message?: string;
  error?: string;
  attempt: number;
  timestamp: string;
}

export interface CampaignProgress {
  campaignId: string;
  total: number;
  completed: number;
  failed: number;
  inFlight: number;
  status: CampaignStatus;
}

export interface EvolutionConnectionTest {
  instanceId: string;
  status: "connected" | "error";
  message?: string;
}
