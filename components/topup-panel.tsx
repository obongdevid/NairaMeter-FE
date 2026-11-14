"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/money";

const PRESETS = [100, 500, 1000, 2000]; // naira
const MIN_NAIRA = 50;
const MAX_NAIRA = 1_000_000;

export function TopupPanel({ userId, highlight }: { userId: string; highlight?: boolean }) {
  const [naira, setNaira] = useState<string>("500");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = Number(naira);
  const valid = Number.isFinite(value) && value >= MIN_NAIRA && value <= MAX_NAIRA;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError(`Enter an amount between ₦${MIN_NAIRA} and ₦${MAX_NAIRA.toLocaleString("en-NG")}.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { authorizationUrl } = await api<{ authorizationUrl: string }>("/wallet/topup", {
        method: "POST",
        userId,
        body: { amountKobo: Math.round(value * 100) },
      });
      window.location.assign(authorizationUrl);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="topup-title"
      className={`rounded-2xl border bg-surface p-6 ${highlight ? "border-accent ring-2 ring-accent/30" : "border-border"}`}
    >
      <h2 id="topup-title" className="text-lg font-semibold">
        Add money
      </h2>
      <p className="mt-1 text-sm text-muted">Pay securely with Paystack — card, bank or transfer.</p>

      <form onSubmit={submit} className="mt-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick amounts">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setNaira(String(p))}
              aria-pressed={value === p}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                value === p
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border hover:bg-surface-2"
              }`}
            >
              {formatNaira(p * 100)}
            </button>
          ))}
        </div>

        <label htmlFor="amount" className="mt-4 block text-sm font-medium">
          Amount (₦)
        </label>
        <input
          id="amount"
          inputMode="decimal"
          value={naira}
          onChange={(e) => setNaira(e.target.value.replace(/[^\d.]/g, ""))}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-lg tabular focus-visible:outline-2 focus-visible:outline-accent"
          aria-invalid={!valid}
          aria-describedby="amount-hint"
        />
        <p id="amount-hint" className="mt-1 text-xs text-muted">
          {valid
            ? `Buys about ${Math.floor(value)} minutes at ₦1/min.`
            : `Minimum ₦${MIN_NAIRA}.`}
        </p>

        <button
          type="submit"
          disabled={busy || !valid}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-accent-fg transition hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {busy ? "Redirecting to Paystack…" : valid ? `Pay ${formatNaira(Math.round(value * 100))}` : "Pay"}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {error}
          </p>
        )}
      </form>

      <p className="mt-4 rounded-lg bg-surface-2 p-3 text-xs text-muted">
        Test mode — use card <span className="font-mono">4084 0840 8408 4081</span>, any future expiry, CVV{" "}
        <span className="font-mono">408</span>.
      </p>
    </section>
  );
}
