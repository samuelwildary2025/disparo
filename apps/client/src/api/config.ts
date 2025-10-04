import { api } from "./client";

export async function testOpenAI() {
  const { data } = await api.post<{ data: { message: string } }>("/config/openai/test");
  return data.data;
}

export async function testEvolution(credentials: { evolutionUrl: string; apiKey: string }) {
  const { data } = await api.post<{ data: { status: string; message?: string } }>(
    "/config/evolution/test",
    credentials
  );
  return data.data;
}
