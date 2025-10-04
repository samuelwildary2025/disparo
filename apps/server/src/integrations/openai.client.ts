import OpenAI from "openai";
import { env } from "../config/env";

export interface GPTVariationParams {
  baseMessage: string;
  contactName: string;
  company?: string;
  customFields?: Record<string, string>;
}

export class OpenAIClient {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });
  }

  async generateVariation(params: GPTVariationParams) {
    const { baseMessage, contactName, company, customFields } = params;
    const response = await this.client.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content:
            "Você é um assistente que cria mensagens curtas e naturais para WhatsApp mantendo contexto e personalização."
        },
        {
          role: "user",
          content: [
            `Mensagem base: ${baseMessage}`,
            `Nome do contato: ${contactName}`,
            company ? `Empresa do contato: ${company}` : null,
            customFields && Object.keys(customFields).length > 0
              ? `Campos extras: ${JSON.stringify(customFields)}`
              : null,
            "Crie uma variação com saudação e ordem de frases diferente, mantendo intenção original e tom profissional."
          ]
            .filter(Boolean)
            .join("\n")
        }
      ]
    });

    return response.choices[0]?.message?.content?.trim() ?? baseMessage;
  }
}
