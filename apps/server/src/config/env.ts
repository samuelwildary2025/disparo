// apps/server/src/config/env.ts
import dotenv from "dotenv";
import { z } from "zod";

// 🔹 Carrega as variáveis do arquivo .env
dotenv.config();

// 🔹 Validação das variáveis de ambiente
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  EVOLUTION_API_URL: z.string().url(),
  EVOLUTION_API_KEY: z.string(),
});

// 🔹 Faz a validação
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.format());
  throw new Error("Invalid environment configuration");
}

// 🔹 Exporta as variáveis seguras
export const env = parsed.data;
