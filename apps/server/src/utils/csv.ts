import Papa from "papaparse";
import type { ContactRecord } from "@app-disparo/shared";
import { AppError } from "./app-error";
import { normalizePhoneNumber } from "./phone";

export interface CsvParseResult {
  contacts: ContactRecord[];
  errors: string[];
}

export function parseContactsCsv(content: string): CsvParseResult {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase()
  });

  if (result.errors.length > 0) {
    throw new AppError("Falha ao processar CSV", 400, result.errors);
  }

  const contacts: ContactRecord[] = [];
  const errors: string[] = [];

  result.data.forEach((row, index) => {
    try {
      const name = row.nome ?? row.name ?? row["nome completo"];
      if (!name) {
        throw new AppError("Nome obrigatório", 422);
      }
      const phoneRaw = row.telefone ?? row.phone ?? row["número"];
      if (!phoneRaw) {
        throw new AppError("Telefone obrigatório", 422);
      }
      const phoneNumber = normalizePhoneNumber(phoneRaw);

      const { nome, name: _name, telefone, phone, ...others } = row;

      contacts.push({
        id: `${index}`,
        name,
        phoneNumber,
        customFields: Object.fromEntries(
          Object.entries(others)
            .filter(([key]) => key && key !== "")
            .map(([key, value]) => [key, value ?? ""])
        )
      });
    } catch (error) {
      errors.push(`Linha ${index + 2}: ${(error as Error).message}`);
    }
  });

  return { contacts, errors };
}
