export interface DispatchJobData {
  campaignId: string;
  dispatchId: string;
  campaignStepId: string;
  dispatchStepId: string;
  stepOrder: number;
  attempt?: number;
}
