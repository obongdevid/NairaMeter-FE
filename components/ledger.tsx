"use client";

import { formatNaira } from "@/lib/money";
import type { LedgerEntry } from "@/lib/types";

interface Props {
  entries: LedgerEntry[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  freshId: string | null;
}

export function Ledger({ entries, loading, hasMore, onLoadMore, freshId }: Props) {
  return (
    <section aria-labelledby="ledger-title" className="rounded-2xl border border-border bg-surface">
      <h2 id="ledger-title" className="border-b border-border px-6 py-4 text-lg font-semibold">
        Transactions
      </h2>

      {loading && entries.length === 0 ? (
        <div className="space-y-2 p-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-2" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="p-6 text-sm text-muted">
          Nothing yet. Add money and your per-minute charges will appear here live.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((e) => {
            const credit = e.type === "TOPUP" || (e.type === "ADJUSTMENT" && e.amountKobo > 0);
            return (
              <li
                key={e.id}
                className={`flex items-center gap-3 px-6 py-3 ${e.id === freshId ? "bg-accent-soft" : ""}`}
              >
                <span
                  aria-hidden
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                    credit ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"
                  }`}
                >
                  {credit ? "+" : "−"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {e.description ?? (credit ? "Top-up" : "Usage")}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(e.createdAt).toLocaleString("en-NG", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`tabular text-sm font-semibold ${credit ? "text-accent" : ""}`}>
                    {credit ? "+" : "−"}
                    {formatNaira(e.amountKobo)}
                  </p>
                  <p className="tabular text-xs text-muted">Bal {formatNaira(e.balanceAfterKobo)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <div className="border-t border-border p-3 text-center">
          <button
            onClick={onLoadMore}
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
          >
            Load older
          </button>
        </div>
      )}
    </section>
  );
}
