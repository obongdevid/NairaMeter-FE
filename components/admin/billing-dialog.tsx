"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_RATE_KOBO } from "@/lib/billing";
import type { AdminUser, BillingPatch } from "@/lib/types";

const TIMEZONES = ["Africa/Lagos", "UTC", "Europe/London", "America/New_York"];

const toTime = (m: number | null | undefined, fallback: string) =>
  m == null ? fallback : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

interface Props {
  user: AdminUser | null;
  onClose: () => void;
  onSave: (userId: string, patch: BillingPatch) => Promise<void>;
}

export function BillingDialog({ user, onClose, onSave }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (user && !d.open) d.showModal();
    if (!user && d.open) d.close();
  }, [user]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="billing-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50"
    >
      {user && <BillingForm key={user.id} user={user} onClose={onClose} onSave={onSave} />}
    </dialog>
  );
}

function BillingForm({ user, onClose, onSave }: Props & { user: AdminUser }) {
  const c = user.billingConfig;
  const [enabled, setEnabled] = useState(c?.enabled ?? true);
  const [rate, setRate] = useState(String((c?.rateKobo ?? DEFAULT_RATE_KOBO) / 100));
  const [always, setAlways] = useState(c?.windowStart == null || c?.windowEnd == null);
  const [start, setStart] = useState(toTime(c?.windowStart, "08:00"));
  const [end, setEnd] = useState(toTime(c?.windowEnd, "22:00"));
  const [timezone, setTimezone] = useState(c?.timezone ?? "Africa/Lagos");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rateNaira = Number(rate);
  const rateValid = Number.isFinite(rateNaira) && rateNaira >= 0.01 && rateNaira <= 1000;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rateValid) {
      setError("Rate must be between ₦0.01 and ₦1,000 per minute.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSave(user.id, {
        enabled,
        rateKobo: Math.round(rateNaira * 100),
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
        Billing for {user.name}
      </h2>
      <p className="text-sm text-muted">Changes apply from the next minute and reach the customer live.</p>

      <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-surface-2 p-3">
        <span>
          <span className="block font-medium">Charge this customer</span>
          <span className="block text-xs text-muted">Turn off to let them stay online for free.</span>
        </span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-5 accent-[var(--accent)]"
        />
      </label>

      <label htmlFor="rate" className="mt-4 block text-sm font-medium">
        Rate per minute (₦)
      </label>
      <input
        id="rate"
        inputMode="decimal"
        value={rate}
        onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))}
        className={`${field} tabular`}
        aria-invalid={!rateValid}
      />

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
            <p className="col-span-2 text-xs text-muted">
              If “To” is earlier than “From”, the window runs overnight.
            </p>
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
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
