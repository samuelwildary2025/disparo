import type { ContactRecord } from "./types";

const VARIABLE_REGEX = /\{(\w+)\}/g;

export function extractTemplateVariables(template: string): string[] {
  const variables = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = VARIABLE_REGEX.exec(template))) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}

export function interpolateTemplate(
  template: string,
  contact: ContactRecord,
  fallback: Record<string, string> = {}
): string {
  return template.replace(VARIABLE_REGEX, (_, key: string) => {
    if (key === "nome" || key === "name") {
      return contact.name;
    }
    if (key === "telefone" || key === "phone") {
      return contact.phoneNumber;
    }
    const normalized = key.toLowerCase();
    if (contact.customFields[normalized]) {
      return contact.customFields[normalized];
    }
    if (contact.customFields[key]) {
      return contact.customFields[key];
    }
    return fallback[key] ?? `{${key}}`;
  });
}
