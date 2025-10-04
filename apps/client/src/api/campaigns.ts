import type { CampaignCreateDto } from "@app-disparo/shared";
import { api } from "./client";
import type { CampaignDetail, CampaignSummary } from "../types";

export async function fetchCampaigns() {
  const { data } = await api.get<{ data: CampaignSummary[] }>("/campaigns");
  return data.data;
}

export async function fetchCampaign(id: string) {
  const { data } = await api.get<{ data: CampaignDetail }>(`/campaigns/${id}`);
  return data.data;
}

export async function createCampaign(payload: CampaignCreateDto) {
  const { data } = await api.post<{ data: CampaignSummary }>("/campaigns", payload);
  return data.data;
}

export async function startCampaign(id: string) {
  const { data } = await api.post<{ data: CampaignSummary }>(`/campaigns/${id}/start`);
  return data.data;
}

export async function pauseCampaign(id: string) {
  const { data } = await api.post<{ data: boolean }>(`/campaigns/${id}/pause`);
  return data.data;
}

export async function resumeCampaign(id: string) {
  const { data } = await api.post<{ data: boolean }>(`/campaigns/${id}/resume`);
  return data.data;
}

export async function fetchCampaignReport(id: string, format: "json" | "csv" = "json") {
  const response = await api.get(`/campaigns/${id}/report`, {
    params: { format },
    responseType: format === "csv" ? "blob" : "json"
  });
  return response.data;
}
