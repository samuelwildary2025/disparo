import type { InstanceCredentialsDto } from "@app-disparo/shared";
import { api } from "./client";
import type { Instance } from "../types";

export async function fetchInstances() {
  const { data } = await api.get<{ data: Instance[] }>("/instances");
  return data.data;
}

export async function createInstance(payload: InstanceCredentialsDto) {
  const { data } = await api.post<{ data: Instance }>("/instances", payload);
  return data.data;
}

export async function testInstance(id: string) {
  const { data } = await api.post<{ data: { status: string; message?: string } }>(
    `/instances/${id}/test`
  );
  return data.data;
}
