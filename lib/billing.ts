import type { BillingPeriod, BillingSettings } from "./types";

export const DEFAULT_AMOUNT_KOBO = 100;

export const PERIOD_MS: Record<BillingPeriod, number> = {
  MINUTE: 60_000,
  HOUR: 3_600_000,
  DAY: 86_400_000,
};

/** The server may fire a little early, so it treats a charge as due 30s sooner. */
export const SLACK_MS = 30_000;

export const PERIOD_LABEL: Record<BillingPeriod, string> = {
  MINUTE: "minute",
  HOUR: "hour",
  DAY: "day",
};

/** Minutes since midnight (0-1439) in an IANA timezone. */
export function minutesOfDay(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

/** Mirrors the backend's window rule (null = always, start > end wraps midnight). */
export function isWithinWindow(now: Date, s: BillingSettings): boolean {
  if (s.windowStart == null || s.windowEnd == null) return true;
  if (s.windowStart === s.windowEnd) return true;
  const m = minutesOfDay(now, s.timezone);
  return s.windowStart < s.windowEnd
    ? m >= s.windowStart && m < s.windowEnd
    : m >= s.windowStart || m < s.windowEnd;
}

/**
 * When the billing cron will next charge this customer (ms epoch).
 * The cron runs at the top of every minute and charges anyone whose last
 * debit is at least one period old.
 */
export function nextChargeAt(now: number, period: BillingPeriod, lastDebitAt: number | null): number {
  const nextMinute = Math.floor(now / 60_000) * 60_000 + 60_000;
  if (period === "MINUTE" || lastDebitAt == null) return nextMinute;
  const due = Math.ceil((lastDebitAt + PERIOD_MS[period] - SLACK_MS) / 60_000) * 60_000;
  return due <= now ? nextMinute : due;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/** Whole minutes of service -> "4h 10m" / "2d 4h". */
export function formatRunway(minutes: number): string {
  if (minutes <= 0) return "0m";
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d) return `${d}d ${h}h`;
  return h ? `${h}h ${m}m` : `${m}m`;
}
