import { api } from "./client";
import type { ContactList } from "../types";

export async function fetchContactLists() {
  const { data } = await api.get<{ data: ContactList[] }>("/contact-lists");
  return data.data;
}

export async function uploadContactList(payload: { file: File; name: string; description?: string }) {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("name", payload.name);
  if (payload.description) {
    form.append("description", payload.description);
  }

  const { data } = await api.post<{ data: { list: ContactList; errors: string[] } }>(
    "/contact-lists/upload",
    form,
    {
      headers: { "Content-Type": "multipart/form-data" }
    }
  );
  return data.data;
}

export async function publishContactList(id: string) {
  const { data } = await api.post<{ data: ContactList }>(`/contact-lists/${id}/publish`);
  return data.data;
}
