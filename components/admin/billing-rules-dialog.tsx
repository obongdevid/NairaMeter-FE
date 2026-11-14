"use client";

import { useEffect, useRef, useState } from "react";
import { PERIOD_LABEL } from "@/lib/billing";
import { formatNaira } from "@/lib/money";
import type { BillingPatch, BillingPeriod, BillingSettings } from "@/lib/types";

const TIMEZONES = ["Africa/Lagos", "UTC", "Europe/London", "America/New_York"];
const PERIODS: BillingPeriod[] = ["MINUTE", "HOUR", "DAY"];

const toTime = (m: number | null | undefined, fallback: string) =>
  m == null ? fallback : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

interface Props {
  open: boolean;
  settings: BillingSettings | null;
  onClose: () => void;
  onSave: (patch: BillingPatch) => Promise<void>;
}

export function BillingRulesDialog({ open, settings, onClose, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="billing-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50"
    >
      {open && settings && <RulesForm settings={settings} onClose={onClose} onSave={onSave} />}
    </dialog>
  );
}

function RulesForm({ settings, onClose, onSave }: { settings: BillingSettings; onClose: () => void; onSave: Props["onSave"] }) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [amount, setAmount] = useState(String(settings.amountKobo / 100));
  const [period, setPeriod] = useState<BillingPeriod>(settings.period);
  const [always, setAlways] = useState(settings.windowStart == null || settings.windowEnd == null);
  const [start, setStart] = useState(toTime(settings.windowStart, "08:00"));
  const [end, setEnd] = useState(toTime(settings.windowEnd, "22:00"));
  const [timezone, setTimezone] = useState(settings.timezone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNaira = Number(amount);
  const amountValid = Number.isFinite(amountNaira) && amountNaira >= 0.01 && amountNaira <= 1000;
  const amountKobo = Math.round(amountNaira * 100);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amountValid) {
      setError("Amount must be between ₦0.01 and ₦1,000.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave({
        enabled,
        amountKobo,
        period,
        windowStart: always ? null : toMinutes(start),
        windowEnd: always ? null : toMinutes(end),
        timezone,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 focus-visible:outline-2 focus-visible:outline-accent";

  return (
    <form onSubmit={submit} className="p-6">
      <h2 id="billing-title" className="text-lg font-semibold">
        Billing rules
      </h2>
      <p className="text-sm text-muted">Applies to every customer. Changes take effect immediately and reach customers live.</p>

      <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-surface-2 p-3">
        <span>
          <span className="block font-medium">Charge customers</span>
          <span className="block text-xs text-muted">Turn off to let everyone stay online for free.</span>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-5 accent-[var(--accent)]"
        />
      </label>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium">
            Amount (₦)
          </label>
          <input
            id="amount"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className={`${field} tabular`}
            aria-invalid={!amountValid}
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium">Per</legend>
          <div className="mt-1 flex overflow-hidden rounded-lg border border-border">
            {PERIODS.map((p) => (
              <label
                key={p}
                className={`cursor-pointer px-3 py-2 text-sm font-medium capitalize has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${
                  period === p ? "bg-accent text-accent-fg" : "hover:bg-surface-2"
                }`}
              >
                <input
                  type="radio"
                  name="period"
                  value={p}
                  checked={period === p}
                  onChange={() => setPeriod(p)}
                  className="sr-only"
                />
                {PERIOD_LABEL[p]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <p className="mt-2 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
        {amountValid
          ? `Everyone is charged ${formatNaira(amountKobo)} per ${PERIOD_LABEL[period]} while signed in — at the start of each ${PERIOD_LABEL[period]}.`
          : "Enter a valid amount."}
      </p>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium">Active billing hours</legend>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={always}
            onChange={(e) => setAlways(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          Bill at any time
        </label>
        {!always && (
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="start" className="text-xs text-muted">From</label>
              <input id="start" type="time" value={start} onChange={(e) => setStart(e.target.value)} className={field} required />
            </div>
            <div>
              <label htmlFor="end" className="text-xs text-muted">To</label>
              <input id="end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={field} required />
            </div>
            <p className="col-span-2 text-xs text-muted">If “To” is earlier than “From”, the window runs overnight.</p>
          </div>
        )}
      </fieldset>

      <label htmlFor="tz" className="mt-4 block text-sm font-medium">
        Timezone
      </label>
      <select id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} className={field}>
        {TIMEZONES.includes(timezone) ? null : <option>{timezone}</option>}
        {TIMEZONES.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {busy ? "Saving…" : "Apply to everyone"}
        </button>
      </div>
    </form>
  );
}
