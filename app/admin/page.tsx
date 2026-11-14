"use client";

import { AppShell } from "@/components/app-shell";
import { useRequireRole } from "@/lib/guards";

export default function AdminPage() {
  const me = useRequireRole("ADMIN");
  if (!me) return null;

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold tracking-tight">Admin dashboard</h1>
      <p className="mt-2 text-sm text-muted">Live users, debits and billing controls arrive in PR 9.</p>
    </AppShell>
  );
}
