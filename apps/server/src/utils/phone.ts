import { parsePhoneNumberFromString } from "libphonenumber-js";
import { AppError } from "./app-error";

export function normalizePhoneNumber(raw: string) {
  const numericOnly = raw.replace(/\D+/g, "");
  const formatted = raw.startsWith("+") ? raw : `+${numericOnly}`;
  const phone = parsePhoneNumberFromString(formatted);
  if (!phone || !phone.isValid()) {
    throw new AppError(`Telefone inválido: ${raw}`, 422);
  }
  return phone.number;
}

export function isWithinTimeWindow(now: Date, start: string, end: string) {
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return minutes >= startMinutes && minutes <= endMinutes;
  }

  // janela que atravessa meia-noite
  return minutes >= startMinutes || minutes <= endMinutes;
}
