"use client";

import {
  PERIOD_LABEL,
  PERIOD_MS,
  formatDuration,
  formatRunway,
  isWithinWindow,
  nextChargeAt,
} from "@/lib/billing";
import { formatMinuteOfDay, formatNaira } from "@/lib/money";
import type { BillingSettings } from "@/lib/types";
import { useNow } from "@/lib/use-now";

interface Props {
  balanceKobo: number;
  settings: BillingSettings;
  online: boolean;
  connectedAt: number | null;
  lastDebitAt: number | null;
  sessionChargedKobo: number;
}

type MeterState = "metering" | "locked" | "off" | "outside" | "offline";

const BADGE: Record<MeterState, { label: string; cls: string; dot: string }> = {
  metering: { label: "LIVE", cls: "bg-accent-soft text-accent", dot: "bg-accent nm-pulse" },
  locked: { label: "LOCKED", cls: "bg-danger-soft text-danger", dot: "bg-danger" },
  off: { label: "BILLING OFF", cls: "bg-surface-2 text-muted", dot: "bg-muted" },
  outside: { label: "PAUSED", cls: "bg-warn-soft text-warn", dot: "bg-warn" },
  offline: { label: "RECONNECTING", cls: "bg-warn-soft text-warn", dot: "bg-warn nm-pulse" },
};

export function MeterCard({ balanceKobo, settings, online, connectedAt, lastDebitAt, sessionChargedKobo }: Props) {
  const now = useNow(1000);
  const { amountKobo, period } = settings;
  const unit = PERIOD_LABEL[period];

  const inWindow = isWithinWindow(new Date(now), settings);
  // Already paid up for the current period? Then a low balance isn't a problem yet.
  const paidUp = period !== "MINUTE" && lastDebitAt != null && now < lastDebitAt + PERIOD_MS[period];
  const canAfford = balanceKobo >= amountKobo;

  const state: MeterState = !online
    ? "offline"
    : !settings.enabled
      ? "off"
      : !inWindow
        ? "outside"
        : !canAfford && !paidUp
          ? "locked"
          : "metering";

  const badge = BADGE[state];
  const metering = state === "metering";

  const nextDeduction = metering
    ? (nextChargeAt(now, period, lastDebitAt) - now) / 1000
    : null;
  const signedIn = connectedAt ? (now - connectedAt) / 1000 : null;
  const periodMinutes = PERIOD_MS[period] / 60_000;
  const runwayMinutes =
    metering || state === "locked" ? Math.floor(balanceKobo / amountKobo) * periodMinutes : null;

  const message: Record<MeterState, string | null> = {
    metering: null,
    locked: "Your wallet can’t cover the next charge. Top up to continue.",
    off: "Billing is switched off right now — you’re not being charged.",
    outside:
      settings.windowStart != null && settings.windowEnd != null
        ? `Billing runs ${formatMinuteOfDay(settings.windowStart)}–${formatMinuteOfDay(settings.windowEnd)}. You’re not being charged right now.`
        : null,
    offline: "Reconnecting to the meter… you aren’t billed while disconnected.",
  };

  return (
    <section
      aria-label="Wallet meter"
      className={`rounded-2xl border bg-surface p-6 shadow-sm ${
        state === "locked" ? "border-danger" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Wallet balance</h2>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${badge.cls}`}
        >
          <span className={`size-1.5 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
      </div>

      <p
        className={`tabular mt-2 text-5xl font-semibold tracking-tight ${
          state === "locked" ? "text-danger" : ""
        }`}
        aria-live="polite"
      >
        {formatNaira(balanceKobo)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {formatNaira(amountKobo)} per {unit} while you’re signed in
      </p>

      {message[state] && (
        <p
          role="status"
          className={`mt-4 rounded-lg px-3 py-2 text-sm ${
            state === "locked" ? "bg-danger-soft text-danger" : "bg-surface-2 text-muted"
          }`}
        >
          {message[state]}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Next deduction"
          value={nextDeduction !== null ? formatDuration(nextDeduction) : "—"}
          strong
        />
        <Stat label="Signed in for" value={signedIn !== null ? formatDuration(signedIn) : "—"} />
        <Stat label="Session charge" value={formatNaira(sessionChargedKobo)} />
        <Stat label="Runway" value={runwayMinutes !== null ? formatRunway(runwayMinutes) : "—"} />
      </dl>
    </section>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`tabular mt-1 font-mono ${strong ? "text-xl font-semibold text-accent" : "text-lg"}`}>
        {value}
      </dd>
    </div>
  );
}
