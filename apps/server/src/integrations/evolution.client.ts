import axios, { AxiosInstance } from "axios";
import type { EvolutionConnectionTest } from "@app-disparo/shared";
import { AppError } from "../utils/app-error";

export interface SendMessagePayload {
  to: string;
  message: string;
  simulateTypingMs?: number;
}

export interface EvolutionInstanceConfig {
  id: string;
  evolutionUrl: string;
  apiKey: string;
}

export class EvolutionClient {
  private readonly http: AxiosInstance;
  private readonly config: EvolutionInstanceConfig;

  constructor(config: EvolutionInstanceConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.evolutionUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 15_000
    });
  }

  async validateConnection(): Promise<EvolutionConnectionTest> {
    try {
      await this.http.get("/status");
      return {
        instanceId: this.config.id,
        status: "connected"
      };
    } catch (error) {
      return {
        instanceId: this.config.id,
        status: "error",
        message: (error as Error).message
      };
    }
  }

  async ensureConnected() {
    const status = await this.validateConnection();
    if (status.status !== "connected") {
      throw new AppError(status.message ?? "Instância desconectada", 503);
    }
  }

  async sendMessage(payload: SendMessagePayload) {
    await this.http.post("/messages", {
      to: payload.to,
      message: payload.message,
      simulateTypingMs: payload.simulateTypingMs ?? 0
    });
  }
}
