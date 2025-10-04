import { randomInt } from "crypto";
import type { AntiBanConfig } from "@app-disparo/shared";
import { isWithinTimeWindow } from "./phone";

export interface AntiBanState {
  messagesSent: number;
  dailyCount: number;
  lastSentAt?: string;
  lastLongPauseAt?: string;
  nextAvailableAt?: string;
}

export interface AntiBanDelayResult {
  baseDelayMs: number;
  longPauseMs: number;
  totalDelayMs: number;
}

export function computeNextDelay(config: AntiBanConfig, state: AntiBanState): AntiBanDelayResult {
  const baseSeconds = randomInt(config.minIntervalSeconds, config.maxIntervalSeconds + 1);
  let longPauseSeconds = 0;

  if (state.messagesSent > 0 && state.messagesSent % config.longPauseEvery === 0) {
    longPauseSeconds = randomInt(config.longPauseMinSeconds, config.longPauseMaxSeconds + 1);
  }

  const baseDelayMs = baseSeconds * 1000;
  const longPauseMs = longPauseSeconds * 1000;
  return {
    baseDelayMs,
    longPauseMs,
    totalDelayMs: baseDelayMs + longPauseMs
  };
}

export function canSendNow(config: AntiBanConfig, now: Date, state: AntiBanState) {
  if (state.dailyCount >= config.dailyLimit) {
    return false;
  }

  if (config.allowedWindows.length === 0) {
    return true;
  }

  return config.allowedWindows.some((window) =>
    isWithinTimeWindow(now, window.start, window.end)
  );
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function nextAllowedDate(config: AntiBanConfig, from: Date) {
  if (config.allowedWindows.length === 0) {
    return from;
  }

  const minutesNow = from.getHours() * 60 + from.getMinutes();
  const sorted = [...config.allowedWindows].sort(
    (a, b) => toMinutes(a.start) - toMinutes(b.start)
  );

  for (const window of sorted) {
    const startMinutes = toMinutes(window.start);
    const endMinutes = toMinutes(window.end);

    if (startMinutes <= minutesNow && minutesNow <= endMinutes) {
      return from;
    }

    if (minutesNow < startMinutes) {
      const date = new Date(from);
      date.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
      return date;
    }
  }

  const [firstWindow] = sorted;
  const nextDay = new Date(from);
  nextDay.setDate(nextDay.getDate() + 1);
  const startMinutes = toMinutes(firstWindow.start);
  nextDay.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  return nextDay;
}
