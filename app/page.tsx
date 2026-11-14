"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { api } from "@/lib/api";
import { homeFor } from "@/lib/guards";
import { useSession } from "@/lib/session";
import type { DevUser } from "@/lib/types";

type LoadState =
  | { kind: "loading"; slow: boolean }
  | { kind: "error"; message: string }
  | { kind: "ready"; users: DevUser[] };

export default function SignInPage() {
  const router = useRouter();
  const { status, me, signIn } = useSession();
  const [state, setState] = useState<LoadState>({ kind: "loading", slow: false });
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setState({ kind: "loading", slow: false });
    // Render's free tier can take ~a minute to wake up; tell the user.
    const slowTimer = setTimeout(() => setState({ kind: "loading", slow: true }), 4000);
    api<DevUser[]>("/dev/users")
      .then((users) => setState({ kind: "ready", users }))
      .catch((e: Error) => setState({ kind: "error", message: e.message }))
      .finally(() => clearTimeout(slowTimer));
    return () => clearTimeout(slowTimer);
  }, []);

  useEffect(() => load(), [load]);

  useEffect(() => {
    if (status === "signed-in" && me) router.replace(homeFor(me.role));
  }, [status, me, router]);

  async function choose(user: DevUser) {
    setPending(user.id);
    setError(null);
    try {
      const profile = await signIn(user.id);
      router.replace(homeFor(profile.role));
    } catch (e) {
      setError((e as Error).message);
      setPending(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <Logo className="text-xl" />
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">Pay for the minutes you use.</h1>
      <p className="mt-2 text-muted">
        Fund your wallet, stay online, and watch ₦1 a minute tick off in real time.
      </p>

      <section className="mt-8" aria-labelledby="accounts">
        <h2 id="accounts" className="text-xs font-semibold uppercase tracking-wider text-muted">
          Choose a demo account
        </h2>

        <div className="mt-3 space-y-2">
          {state.kind === "loading" &&
            [0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
            ))}

          {state.kind === "ready" &&
            state.users.map((u) => (
              <button
                key={u.id}
                onClick={() => choose(u)}
                disabled={pending !== null}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-3 text-left transition hover:border-accent disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span className="grid size-10 place-items-center rounded-full bg-accent-soft font-semibold text-accent">
                  {u.name[0]}
                </span>
                <span className="flex-1">
                  <span className="block font-medium">{u.name}</span>
                  <span className="block text-sm text-muted">{u.email}</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.role === "ADMIN" ? "bg-warn-soft text-warn" : "bg-surface-2 text-muted"
                  }`}
                >
                  {pending === u.id ? "Signing in…" : u.role === "ADMIN" ? "Admin" : "Customer"}
                </span>
              </button>
            ))}
        </div>

        {state.kind === "loading" && state.slow && (
          <p className="mt-3 text-sm text-muted" role="status">
            Waking the server up — this can take up to a minute on the first visit…
          </p>
        )}
        {state.kind === "error" && (
          <div className="mt-3 rounded-xl border border-border bg-danger-soft p-4 text-sm" role="alert">
            <p className="font-medium text-danger">Couldn’t reach the server.</p>
            <p className="mt-1 text-muted">{state.message}</p>
            <button onClick={load} className="mt-3 font-medium text-danger underline underline-offset-2">
              Try again
            </button>
          </div>
        )}
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </section>

      <p className="mt-8 text-xs text-muted">
        Demo mode: there is no password. Real sign-in comes later.
      </p>
    </div>
  );
}
