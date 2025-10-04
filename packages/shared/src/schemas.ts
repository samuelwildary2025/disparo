import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const uploadCsvSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export const phoneNumberSchema = z
  .string()
  .regex(/^\+?[1-9]\d{7,14}$/); // E.164

export const contactSchema = z.object({
  name: z.string().min(1),
  phoneNumber: phoneNumberSchema,
  customFields: z.record(z.string()).optional().default({})
});

export const antiBanConfigSchema = z.object({
  minIntervalSeconds: z.number().min(1),
  maxIntervalSeconds: z.number().min(1),
  longPauseEvery: z.number().min(1),
  longPauseMinSeconds: z.number().min(1),
  longPauseMaxSeconds: z.number().min(1),
  dailyLimit: z.number().min(1),
  allowedWindows: z
    .array(
      z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/)
      })
    )
    .min(1)
});

export const campaignCreateSchema = z.object({
  name: z.string().min(1),
  templateId: z.string().uuid(),
  contactListId: z.string().uuid(),
  instanceId: z.string().uuid(),
  scheduleAt: z.string().datetime().optional(),
  antiBan: antiBanConfigSchema,
  mode: z.enum(["test", "live"]).default("live"),
  testSampleSize: z.number().min(1).max(100).optional(),
  steps: z
    .array(
      z.object({
        templateId: z.string().uuid(),
        delayMinSeconds: z.number().int().min(0).default(0),
        delayMaxSeconds: z.number().int().min(0).default(0),
        waitForReplySeconds: z.number().int().min(0).optional(),
        cancelIfReply: z.boolean().optional(),
        skipIfAutoReply: z.boolean().optional(),
        typingMsOverride: z.number().int().min(0).optional(),
        aiVariation: z.boolean().optional()
      })
    )
    .optional()
});

export const messageTemplateSchema = z.object({
  name: z.string().min(1),
  content: z.string().min(1),
  variables: z.array(z.string()).default([])
});

export const blacklistSchema = z.object({
  phoneNumber: phoneNumberSchema,
  reason: z.string().max(200).optional()
});

export const instanceCredentialsSchema = z.object({
  name: z.string().min(1),
  evolutionUrl: z.string().url(),
  apiKey: z.string().min(10)
});

export const openAiConfigSchema = z.object({
  apiKey: z.string().min(20)
});

export type LoginDto = z.infer<typeof loginSchema>;
export type CampaignCreateDto = z.infer<typeof campaignCreateSchema>;
export type MessageTemplateDto = z.infer<typeof messageTemplateSchema>;
export type InstanceCredentialsDto = z.infer<typeof instanceCredentialsSchema>;
