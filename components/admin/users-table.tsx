"use client";

import { formatMinuteOfDay, formatNaira } from "@/lib/money";
import { DEFAULT_RATE_KOBO } from "@/lib/billing";
import type { AdminUser } from "@/lib/types";

function billingLabel(u: AdminUser) {
  const c = u.billingConfig;
  if (c && !c.enabled) return "Off";
  if (c?.windowStart != null && c.windowEnd != null) {
    return `${formatMinuteOfDay(c.windowStart)}–${formatMinuteOfDay(c.windowEnd)}`;
  }
  return "Always";
}

export function UsersTable({
  users,
  onEdit,
}: {
  users: AdminUser[];
  onEdit: (u: AdminUser) => void;
}) {
  if (users.length === 0) {
    return <p className="p-6 text-sm text-muted">No customers yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
            <th scope="col" className="px-6 py-3 font-medium">Customer</th>
            <th scope="col" className="px-3 py-3 font-medium">Status</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Balance</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">Rate / min</th>
            <th scope="col" className="px-3 py-3 font-medium">Billing</th>
            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => {
            const rate = u.billingConfig?.rateKobo ?? DEFAULT_RATE_KOBO;
            const enabled = u.billingConfig?.enabled ?? true;
            const broke = enabled && u.balanceKobo < rate;
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
                    {broke && (
                      <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-medium text-danger">
                        Out of funds
                      </span>
                    )}
                  </span>
                </td>
                <td className={`tabular px-3 py-3 text-right font-medium ${broke ? "text-danger" : ""}`}>
                  {formatNaira(u.balanceKobo)}
                </td>
                <td className="tabular px-3 py-3 text-right">{formatNaira(rate)}</td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      !enabled ? "bg-surface-2 text-muted" : "bg-accent-soft text-accent"
                    }`}
                  >
                    {billingLabel(u)}
                  </span>
                </td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => onEdit(u)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    aria-label={`Edit billing for ${u.name}`}
                  >
                    Edit billing
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
