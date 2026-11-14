"use client";

import { AppShell } from "@/components/app-shell";
import { Ledger } from "@/components/ledger";
import { MeterCard } from "@/components/meter-card";
import { TopupPanel } from "@/components/topup-panel";
import { PERIOD_LABEL, PERIOD_MS } from "@/lib/billing";
import { useRequireRole } from "@/lib/guards";
import type { Me } from "@/lib/types";
import { useWallet } from "@/lib/use-wallet";
import { useNow } from "@/lib/use-now";

export default function WalletPage() {
  const me = useRequireRole("USER");
  if (!me) return null;
  return <WalletView me={me} />;
}

function WalletView({ me }: { me: Me }) {
  const w = useWallet(me);
  const now = useNow(5000);
  const { settings } = w;
  const paidUp =
    settings.period !== "MINUTE" &&
    w.lastDebitAt != null &&
    now < w.lastDebitAt + PERIOD_MS[settings.period];
  const locked = settings.enabled && w.balanceKobo < settings.amountKobo && !paidUp;

  return (
    <AppShell>
      <p className="text-sm text-muted">Welcome back, {me.name}</p>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <MeterCard
            balanceKobo={w.balanceKobo}
            settings={settings}
            online={w.online}
            connectedAt={w.connectedAt}
            lastDebitAt={w.lastDebitAt}
            sessionChargedKobo={w.sessionChargedKobo}
          />
          <Ledger
            entries={w.entries}
            loading={w.ledgerLoading}
            hasMore={w.hasMore}
            onLoadMore={w.loadMore}
            freshId={w.freshId}
          />
        </div>
        <TopupPanel
          userId={me.id}
          highlight={locked}
          amountKobo={settings.amountKobo}
          periodLabel={PERIOD_LABEL[settings.period]}
        />
      </div>
    </AppShell>
  );
}
