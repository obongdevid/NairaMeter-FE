"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/lib/session";
import { ConnectionBadge } from "./connection-badge";
import { Logo } from "./logo";

export function AppShell({ children }: { children: ReactNode }) {
  const { me, signOut } = useSession();
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4">
          <Logo />
          <div className="flex items-center gap-3">
            <ConnectionBadge />
            {me && (
              <div className="hidden text-right leading-tight sm:block">
                <div className="text-sm font-medium">{me.name}</div>
                <div className="text-xs text-muted">{me.role === "ADMIN" ? "Admin" : "Customer"}</div>
              </div>
            )}
            <button
              onClick={() => {
                signOut();
                router.replace("/");
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Switch account
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
