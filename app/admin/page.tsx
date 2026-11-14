"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { BillingDialog } from "@/components/admin/billing-dialog";
import { LiveFeed } from "@/components/admin/live-feed";
import { StatTile } from "@/components/admin/stat-tile";
import { UsersTable } from "@/components/admin/users-table";
import { DEFAULT_RATE_KOBO, formatDuration } from "@/lib/billing";
import { useRequireRole } from "@/lib/guards";
import { formatNaira } from "@/lib/money";
import type { AdminUser, Me } from "@/lib/types";
import { useAdmin } from "@/lib/use-admin";
import { useNow } from "@/lib/use-now";

export default function AdminPage() {
  const me = useRequireRole("ADMIN");
  if (!me) return null;
  return <Dashboard me={me} />;
}

function Dashboard({ me }: { me: Me }) {
  const { users, feed, collectedKobo, loading, error, updateBilling } = useAdmin(me.id);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const now = useNow(1000);

  const online = users.filter((u) => u.online).length;
  const outOfFunds = users.filter(
    (u) => (u.billingConfig?.enabled ?? true) && u.balanceKobo < (u.billingConfig?.rateKobo ?? DEFAULT_RATE_KOBO),
  ).length;
  const totalHeld = users.reduce((sum, u) => sum + u.balanceKobo, 0);
  const nextRun = 60 - new Date(now).getSeconds();

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live dashboard</h1>
          <p className="text-sm text-muted">Online customers, incoming debits and per-customer billing.</p>
        </div>
        <p className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          Next billing run in <span className="tabular font-mono font-semibold text-foreground">{formatDuration(nextRun)}</span>
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft p-4 text-sm text-danger">
          Couldn’t load data: {error}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Online now" value={String(online)} hint={`of ${users.length} customers`} tone="accent" />
        <StatTile label="Collected live" value={formatNaira(collectedKobo)} hint="since you opened this page" />
        <StatTile label="Held in wallets" value={formatNaira(totalHeld)} hint="across all customers" />
        <StatTile
          label="Out of funds"
          value={String(outOfFunds)}
          hint="can’t cover next minute"
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
            <UsersTable users={users} onEdit={setEditing} />
          )}
        </section>

        <section aria-labelledby="activity" className="rounded-2xl border border-border bg-surface">
          <h2 id="activity" className="border-b border-border px-6 py-4 text-lg font-semibold">
            Live activity
          </h2>
          <LiveFeed items={feed} />
        </section>
      </div>

      <BillingDialog user={editing} onClose={() => setEditing(null)} onSave={updateBilling} />
    </AppShell>
  );
}
