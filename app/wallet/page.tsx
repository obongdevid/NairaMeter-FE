"use client";

import { AppShell } from "@/components/app-shell";
import { Ledger } from "@/components/ledger";
import { MeterCard } from "@/components/meter-card";
import { TopupPanel } from "@/components/topup-panel";
import { useRequireRole } from "@/lib/guards";
import type { Me } from "@/lib/types";
import { useWallet } from "@/lib/use-wallet";

export default function WalletPage() {
  const me = useRequireRole("USER");
  if (!me) return null;
  return <WalletView me={me} />;
}

function WalletView({ me }: { me: Me }) {
  const w = useWallet(me);
  const locked = w.billingEnabled && w.balanceKobo < w.rateKobo;

  return (
    <AppShell>
      <p className="text-sm text-muted">Welcome back, {me.name}</p>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <MeterCard
            balanceKobo={w.balanceKobo}
            rateKobo={w.rateKobo}
            config={w.config}
            billingEnabled={w.billingEnabled}
            online={w.online}
            connectedAt={w.connectedAt}
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
        <TopupPanel userId={me.id} highlight={locked} />
      </div>
    </AppShell>
  );
}
