import type { ContactRecord } from "@app-disparo/shared";
import { AppError } from "../utils/app-error";
import { OpenAIClient } from "../integrations/openai.client";
import { interpolateTemplate } from "@app-disparo/shared";
import { logger } from "../config/logger";

interface PersonalizationContext {
  template: string;
  contact: ContactRecord;
  fallback?: Record<string, string>;
  useAi?: boolean;
}

export class MessagePersonalizerService {
  private readonly client = new OpenAIClient();

  async generate(context: PersonalizationContext) {
    const baseMessage = interpolateTemplate(context.template, context.contact, context.fallback);

    if (context.useAi === false) {
      return baseMessage;
    }

    try {
      const variation = await this.client.generateVariation({
        baseMessage,
        contactName: context.contact.name,
        company: context.contact.customFields["empresa"],
        customFields: context.contact.customFields
      });

      return variation.trim();
    } catch (error) {
      logger.error({ error }, "openai variation failed");
      if (error instanceof AppError) {
        throw error;
      }
      return baseMessage;
    }
  }
}
