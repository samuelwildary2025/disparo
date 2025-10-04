import type { MessageTemplateDto } from "@app-disparo/shared";
import { api } from "./client";
import type { Template } from "../types";

export async function fetchTemplates() {
  const { data } = await api.get<{ data: Template[] }>("/templates");
  return data.data;
}

export async function createTemplate(payload: MessageTemplateDto) {
  const { data } = await api.post<{ data: Template }>("/templates", payload);
  return data.data;
}

export async function updateTemplate(id: string, payload: MessageTemplateDto) {
  const { data } = await api.put<{ data: Template }>(`/templates/${id}`, payload);
  return data.data;
}
