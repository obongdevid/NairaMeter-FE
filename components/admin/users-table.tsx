"use client";

import { PERIOD_MS, formatDuration, isWithinWindow, nextChargeAt } from "@/lib/billing";
import { formatNaira } from "@/lib/money";
import type { AdminUser, BillingSettings } from "@/lib/types";
import { useNow } from "@/lib/use-now";

/** What to show in the "Next charge" column for one customer. */
function nextChargeCell(u: AdminUser, s: BillingSettings, now: number) {
  if (!u.online) return { text: "Offline", tone: "muted" as const };
  if (!s.enabled) return { text: "Billing off", tone: "muted" as const };
  if (!isWithinWindow(new Date(now), s)) return { text: "Outside hours", tone: "muted" as const };

  const last = u.lastDebitAt ? new Date(u.lastDebitAt).getTime() : null;
  const paidUp = s.period !== "MINUTE" && last != null && now < last + PERIOD_MS[s.period];
  if (u.balanceKobo < s.amountKobo && !paidUp) return { text: "Needs top-up", tone: "danger" as const };

  const seconds = (nextChargeAt(now, s.period, last) - now) / 1000;
  return { text: formatDuration(seconds), tone: "accent" as const };
}

export function UsersTable({ users, settings }: { users: AdminUser[]; settings: BillingSettings }) {
  const now = useNow(1000);

  if (users.length === 0) {
    return <p className="p-6 text-sm text-muted">No customers yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
            <th scope="col" className="px-6 py-3 font-medium">Customer</th>
            <th scope="col" className="px-3 py-3 font-medium">Status</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Balance</th>
            <th scope="col" className="px-6 py-3 text-right font-medium">Next charge</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => {
            const broke = settings.enabled && u.balanceKobo < settings.amountKobo;
            const next = nextChargeCell(u, settings, now);
            return (
              <tr key={u.id}>
                <td className="px-6 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-muted">{u.email}</p>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${u.online ? "bg-accent nm-pulse" : "bg-muted"}`}
                      aria-hidden
                    />
                    {u.online ? "Online" : "Offline"}
                  </span>
                </td>
                <td className={`tabular px-3 py-3 text-right font-medium ${broke ? "text-danger" : ""}`}>
                  {formatNaira(u.balanceKobo)}
                </td>
                <td
                  className={`tabular px-6 py-3 text-right font-mono ${
                    next.tone === "accent"
                      ? "font-semibold text-accent"
                      : next.tone === "danger"
                        ? "font-sans text-xs font-medium text-danger"
                        : "font-sans text-xs text-muted"
                  }`}
                >
                  {next.text}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
