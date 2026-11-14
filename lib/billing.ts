import type { BillingConfig } from "./types";

export const DEFAULT_RATE_KOBO = 100;

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
export function isWithinWindow(now: Date, c: BillingConfig | null): boolean {
  if (!c || c.windowStart == null || c.windowEnd == null) return true;
  if (c.windowStart === c.windowEnd) return true;
  const m = minutesOfDay(now, c.timezone);
  return c.windowStart < c.windowEnd
    ? m >= c.windowStart && m < c.windowEnd
    : m >= c.windowStart || m < c.windowEnd;
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/** Whole minutes of service the balance buys -> "4h 10m". */
export function formatRunway(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}
