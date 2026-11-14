"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api";
import { formatNaira } from "@/lib/money";
import { useSession } from "@/lib/session";

type Result =
  | { kind: "verifying" }
  | { kind: "credited"; balanceKobo: number }
  | { kind: "already" }
  | { kind: "failed"; message: string };

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <Callback />
    </Suspense>
  );
}

function Callback() {
  const params = useSearchParams();
  const router = useRouter();
  const { status, userId } = useSession();
  const [result, setResult] = useState<Result>({ kind: "verifying" });
  const started = useRef(false);

  const reference = params.get("reference") ?? params.get("trxref");

  useEffect(() => {
    if (status === "signed-out") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (status !== "signed-in" || !userId || started.current) return;
    if (!reference) {
      setResult({ kind: "failed", message: "No payment reference found." });
      return;
    }
    started.current = true;
    api<
      | { status: "credited"; balanceKobo: number }
      | { status: "already_credited" }
      | { status: "not_successful"; paystackStatus: string }
    >(`/wallet/verify?reference=${encodeURIComponent(reference)}`, { userId })
      .then((r) => {
        if (r.status === "credited") setResult({ kind: "credited", balanceKobo: r.balanceKobo });
        else if (r.status === "already_credited") setResult({ kind: "already" });
        else setResult({ kind: "failed", message: `Payment ${r.paystackStatus}. You weren’t charged.` });
      })
      .catch((e: Error) => setResult({ kind: "failed", message: e.message }));
  }, [status, userId, reference]);

  useEffect(() => {
    if (result.kind === "credited" || result.kind === "already") {
      const t = setTimeout(() => router.replace("/wallet"), 2500);
      return () => clearTimeout(t);
    }
  }, [result, router]);

  return (
    <AppShell>
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-border bg-surface p-8 text-center" role="status">
        {result.kind === "verifying" && (
          <>
            <div className="mx-auto size-10 animate-spin rounded-full border-4 border-border border-t-accent" />
            <h1 className="mt-4 text-lg font-semibold">Confirming your payment…</h1>
          </>
        )}
        {result.kind === "credited" && (
          <>
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-soft text-2xl text-accent">✓</div>
            <h1 className="mt-4 text-lg font-semibold">Payment received</h1>
            <p className="mt-1 text-muted">New balance {formatNaira(result.balanceKobo)}</p>
          </>
        )}
        {result.kind === "already" && (
          <>
            <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-soft text-2xl text-accent">✓</div>
            <h1 className="mt-4 text-lg font-semibold">Payment already applied</h1>
          </>
        )}
        {result.kind === "failed" && (
          <>
            <h1 className="text-lg font-semibold text-danger">Couldn’t confirm payment</h1>
            <p className="mt-1 text-muted">{result.message}</p>
          </>
        )}
        <Link href="/wallet" className="mt-6 inline-block font-medium text-accent underline underline-offset-2">
          Back to wallet
        </Link>
      </div>
    </AppShell>
  );
}
