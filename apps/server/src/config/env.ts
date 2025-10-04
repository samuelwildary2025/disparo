import "dotenv/config";
import { z } from "zod";

type NodeEnv = "development" | "test" | "production";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url({ message: "DATABASE_URL must be a valid URL" }),
  REDIS_URL: z.string().url({ message: "REDIS_URL must be a valid URL" }),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  OPENAI_API_KEY: z.string().min(20),
  EVOLUTION_API_URL: z.string().url(),
  EVOLUTION_API_KEY: z.string().min(10)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;
export const isDev: boolean = parsed.data.NODE_ENV === "development";
export const isTest: boolean = parsed.data.NODE_ENV === "test";
export const isProd: boolean = parsed.data.NODE_ENV === "production";

export function requireEnv<K extends keyof typeof env>(key: K): (typeof env)[K] {
  return env[key];
}
