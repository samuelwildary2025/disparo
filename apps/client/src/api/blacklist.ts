import { api } from "./client";

export interface BlacklistEntry {
  id: string;
  phoneNumber: string;
  reason?: string | null;
  createdAt: string;
}

export async function fetchBlacklist() {
  const { data } = await api.get<{ data: BlacklistEntry[] }>("/blacklist");
  return data.data;
}

export async function addToBlacklist(phoneNumber: string, reason?: string) {
  const { data } = await api.post<{ data: BlacklistEntry }>("/blacklist", {
    phoneNumber,
    reason
  });
  return data.data;
}

export async function removeFromBlacklist(phoneNumber: string) {
  await api.delete(`/blacklist/${encodeURIComponent(phoneNumber)}`);
}
