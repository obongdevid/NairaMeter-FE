"use client";

import {
  formatDuration,
  formatRunway,
  isWithinWindow,
} from "@/lib/billing";
import { formatMinuteOfDay, formatNaira } from "@/lib/money";
import type { BillingConfig } from "@/lib/types";
import { useNow } from "@/lib/use-now";

interface Props {
  balanceKobo: number;
  rateKobo: number;
  config: BillingConfig | null;
  billingEnabled: boolean;
  online: boolean;
  connectedAt: number | null;
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

export function MeterCard(p: Props) {
  const now = useNow(1000);
  const date = new Date(now);

  const inWindow = isWithinWindow(date, p.config);
  const canAfford = p.balanceKobo >= p.rateKobo;
  const state: MeterState = !p.online
    ? "offline"
    : !p.billingEnabled
      ? "off"
      : !inWindow
        ? "outside"
        : !canAfford
          ? "locked"
          : "metering";

  const badge = BADGE[state];
  const metering = state === "metering";

  // The backend bills at the top of every minute.
  const nextDeduction = metering ? 60 - date.getSeconds() : null;
  const signedIn = p.connectedAt ? (now - p.connectedAt) / 1000 : null;
  const runwayMinutes = metering || state === "locked" ? Math.floor(p.balanceKobo / p.rateKobo) : null;

  const message: Record<MeterState, string | null> = {
    metering: null,
    locked: "Your wallet can’t cover another minute. Top up to continue.",
    off: "Billing is switched off for your account — you’re not being charged.",
    outside:
      p.config?.windowStart != null && p.config.windowEnd != null
        ? `Billing runs ${formatMinuteOfDay(p.config.windowStart)}–${formatMinuteOfDay(p.config.windowEnd)}. You’re not being charged right now.`
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
        {formatNaira(p.balanceKobo)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {formatNaira(p.rateKobo)} per minute while you’re signed in
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
        <Stat label="Session charge" value={formatNaira(p.sessionChargedKobo)} />
        <Stat
          label="Runway"
          value={runwayMinutes !== null ? formatRunway(runwayMinutes) : "—"}
        />
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
