"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BillingRulesDialog } from "@/components/admin/billing-rules-dialog";
import { LiveFeed } from "@/components/admin/live-feed";
import { StatTile } from "@/components/admin/stat-tile";
import { UsersTable } from "@/components/admin/users-table";
import {
  DEFAULT_AMOUNT_KOBO,
  PERIOD_LABEL,
  PERIOD_MS,
  formatDuration,
  isWithinWindow,
  nextChargeAt,
} from "@/lib/billing";
import { useRequireRole } from "@/lib/guards";
import { formatMinuteOfDay, formatNaira } from "@/lib/money";
import type { BillingSettings, Me } from "@/lib/types";
import { useAdmin } from "@/lib/use-admin";
import { useNow } from "@/lib/use-now";

export default function AdminPage() {
  const me = useRequireRole("ADMIN");
  if (!me) return null;
  return <Dashboard me={me} />;
}

function rulesSummary(s: BillingSettings) {
  if (!s.enabled) return "Billing is off — nobody is being charged.";
  const hours =
    s.windowStart != null && s.windowEnd != null
      ? `between ${formatMinuteOfDay(s.windowStart)} and ${formatMinuteOfDay(s.windowEnd)} (${s.timezone})`
      : "at any time";
  return `${formatNaira(s.amountKobo)} per ${PERIOD_LABEL[s.period]}, charged at the start of each ${PERIOD_LABEL[s.period]} while signed in, ${hours}.`;
}

function Dashboard({ me }: { me: Me }) {
  const { users, settings, feed, collectedKobo, loading, error, updateSettings } = useAdmin(me.id);
  const [editing, setEditing] = useState(false);
  const now = useNow(1000);

  const amountKobo = settings?.amountKobo ?? DEFAULT_AMOUNT_KOBO;
  const enabled = settings?.enabled ?? true;
  const online = users.filter((u) => u.online).length;
  const outOfFunds = enabled ? users.filter((u) => u.balanceKobo < amountKobo).length : 0;
  const totalHeld = users.reduce((sum, u) => sum + u.balanceKobo, 0);
  // Soonest upcoming charge among online customers who will actually be billed.
  let nextRun: number | null = null;
  if (settings && settings.enabled && isWithinWindow(new Date(now), settings)) {
    for (const u of users) {
      if (!u.online) continue;
      const last = u.lastDebitAt ? new Date(u.lastDebitAt).getTime() : null;
      const paidUp = settings.period !== "MINUTE" && last != null && now < last + PERIOD_MS[settings.period];
      if (u.balanceKobo < settings.amountKobo && !paidUp) continue;
      const at = nextChargeAt(now, settings.period, last);
      if (nextRun === null || at < nextRun) nextRun = at;
    }
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live dashboard</h1>
          <p className="text-sm text-muted">Online customers, incoming debits and billing rules.</p>
        </div>
        <p className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          Next charge{" "}
          <span className="tabular font-mono font-semibold text-foreground">
            {nextRun !== null ? `in ${formatDuration((nextRun - now) / 1000)}` : "— nobody due"}
          </span>
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-4 text-sm text-danger">
          Couldn’t load data: {error}
        </p>
      )}

      <section
        aria-labelledby="rules"
        className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5"
      >
        <div className="min-w-0">
          <h2 id="rules" className="text-xs font-medium uppercase tracking-wider text-muted">
            Billing rules · all customers
          </h2>
          <p className="mt-1 text-lg font-semibold">
            {settings ? (
              <>
                {enabled ? `${formatNaira(settings.amountKobo)} per ${PERIOD_LABEL[settings.period]}` : "Billing off"}
              </>
            ) : (
              "Loading…"
            )}
          </p>
          {settings && <p className="mt-1 text-sm text-muted">{rulesSummary(settings)}</p>}
        </div>
        <button
          onClick={() => setEditing(true)}
          disabled={!settings}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Edit billing rules
        </button>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Online now" value={String(online)} hint={`of ${users.length} customers`} tone="accent" />
        <StatTile label="Collected live" value={formatNaira(collectedKobo)} hint="since you opened this page" />
        <StatTile label="Held in wallets" value={formatNaira(totalHeld)} hint="across all customers" />
        <StatTile
          label="Out of funds"
          value={String(outOfFunds)}
          hint="can’t cover the next charge"
          tone={outOfFunds ? "danger" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="customers" className="rounded-2xl border border-border bg-surface">
          <h2 id="customers" className="border-b border-border px-6 py-4 text-lg font-semibold">
            Customers
          </h2>
          {loading ? (
            <div className="space-y-2 p-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-2" />
              ))}
            </div>
          ) : (
            settings && <UsersTable users={users} settings={settings} />
          )}
        </section>

        <section aria-labelledby="activity" className="rounded-2xl border border-border bg-surface">
          <h2 id="activity" className="border-b border-border px-6 py-4 text-lg font-semibold">
            Live activity
          </h2>
          <LiveFeed items={feed} />
        </section>
      </div>

      <BillingRulesDialog
        open={editing}
        settings={settings}
        onClose={() => setEditing(false)}
        onSave={updateSettings}
      />
    </AppShell>
  );
}
