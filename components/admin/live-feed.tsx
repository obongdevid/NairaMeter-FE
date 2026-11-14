"use client";

import { formatNaira } from "@/lib/money";
import type { FeedItem } from "@/lib/types";

export function LiveFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) {
    return <p className="p-6 text-sm text-muted">Waiting for activity… debits appear here as they happen.</p>;
  }
  return (
    <ul role="log" aria-live="polite" aria-label="Live activity" className="max-h-[32rem] divide-y divide-border overflow-y-auto">
      {items.map((i) => {
        const credit = i.kind === "TOPUP";
        return (
          <li key={i.id} className="flex items-center gap-3 px-6 py-3">
            <span
              aria-hidden
              className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                credit ? "bg-accent-soft text-accent" : "bg-surface-2 text-muted"
              }`}
            >
              {credit ? "+" : "−"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                <span className="font-medium">{i.name}</span>{" "}
                <span className="text-muted">{credit ? "topped up" : "was charged"}</span>
              </p>
              <p className="text-xs text-muted">
                {new Date(i.at).toLocaleTimeString("en-NG", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className={`tabular text-sm font-semibold ${credit ? "text-accent" : ""}`}>
                {credit ? "+" : "−"}
                {formatNaira(i.amountKobo)}
              </p>
              <p className="tabular text-xs text-muted">Bal {formatNaira(i.balanceAfterKobo)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
