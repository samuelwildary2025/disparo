// apps/server/src/config/env.ts
import dotenv from "dotenv";
import { z } from "zod";

// 🔹 Carrega as variáveis do arquivo .env
dotenv.config();

// 🔹 Define e valida todas as variáveis de ambiente usadas no projeto
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  OPENAI_API_KEY: z.string().optional(),
  EVOLUTION_API_URL: z.string().url(),
  EVOLUTION_API_KEY: z.string(),
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
});

// 🔹 Faz a validação
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.format());
  throw new Error("Invalid environment configuration");
}

// 🔹 Exporta as variáveis e um helper para verificar se está em dev
export const env = parsed.data;
export const isDev = env.NODE_ENV === "development";
