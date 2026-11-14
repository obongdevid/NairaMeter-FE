"use client";

import { formatNaira } from "@/lib/money";
import type { AdminUser } from "@/lib/types";

export function UsersTable({
  users,
  amountKobo,
  billingEnabled,
}: {
  users: AdminUser[];
  amountKobo: number;
  billingEnabled: boolean;
}) {
  if (users.length === 0) {
    return <p className="p-6 text-sm text-muted">No customers yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted">
            <th scope="col" className="px-6 py-3 font-medium">Customer</th>
            <th scope="col" className="px-3 py-3 font-medium">Status</th>
            <th scope="col" className="px-6 py-3 text-right font-medium">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((u) => {
            const broke = billingEnabled && u.balanceKobo < amountKobo;
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
                <td className={`tabular px-6 py-3 text-right font-medium ${broke ? "text-danger" : ""}`}>
                  {formatNaira(u.balanceKobo)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
