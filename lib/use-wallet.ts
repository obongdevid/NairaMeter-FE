"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { DEFAULT_RATE_KOBO } from "./billing";
import { useSocket } from "./socket";
import type { BillingConfig, LedgerEntry, Me, TransactionType } from "./types";

interface LiveUpdate {
  balanceKobo: number;
  transaction: {
    id: string;
    type?: TransactionType; // debit events omit it
    amountKobo: number;
    balanceAfterKobo: number;
    createdAt: string;
  };
}

interface LedgerPage {
  items: LedgerEntry[];
  nextCursor: string | null;
}

/** Live wallet state for the signed-in customer, fed by the socket. */
export function useWallet(me: Me) {
  const { socket, status, connectedAt, handshakeBalanceKobo } = useSocket();
  const [balanceKobo, setBalanceKobo] = useState(me.balanceKobo);
  const [config, setConfig] = useState<BillingConfig | null>(me.billingConfig);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [sessionChargedKobo, setSessionChargedKobo] = useState(0);
  const [freshId, setFreshId] = useState<string | null>(null);

  // (Re)load the ledger on first mount and after every reconnect, so
  // anything missed while offline shows up.
  useEffect(() => {
    let cancelled = false;
    api<LedgerPage>("/transactions?limit=30", { userId: me.id })
      .then((page) => {
        if (cancelled) return;
        setEntries(page.items);
        setNextCursor(page.nextCursor);
      })
      .finally(() => !cancelled && setLedgerLoading(false));
    return () => {
      cancelled = true;
    };
  }, [me.id, connectedAt]);

  // The handshake balance is authoritative after (re)connecting.
  useEffect(() => {
    if (handshakeBalanceKobo != null) setBalanceKobo(handshakeBalanceKobo);
    setSessionChargedKobo(0);
  }, [handshakeBalanceKobo, connectedAt]);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (u: LiveUpdate) => {
      const type = u.transaction.type ?? "DEBIT";
      setBalanceKobo(u.balanceKobo);
      if (type === "DEBIT") setSessionChargedKobo((s) => s + u.transaction.amountKobo);
      setFreshId(u.transaction.id);
      setEntries((prev) =>
        prev.some((e) => e.id === u.transaction.id)
          ? prev
          : [
              {
                ...u.transaction,
                type,
                description: type === "TOPUP" ? "Wallet top-up" : "Per-minute usage",
              },
              ...prev,
            ],
      );
    };
    const onConfig = (c: BillingConfig) => setConfig(c);
    socket.on("balance:update", onUpdate);
    socket.on("billing:config", onConfig);
    return () => {
      socket.off("balance:update", onUpdate);
      socket.off("billing:config", onConfig);
    };
  }, [socket]);

  const loadMore = useCallback(async () => {
    if (!nextCursor) return;
    const page = await api<LedgerPage>(
      `/transactions?limit=30&cursor=${encodeURIComponent(nextCursor)}`,
      { userId: me.id },
    );
    setEntries((prev) => [...prev, ...page.items.filter((i) => !prev.some((e) => e.id === i.id))]);
    setNextCursor(page.nextCursor);
  }, [nextCursor, me.id]);

  return {
    online: status === "online",
    connecting: status === "connecting" || status === "offline",
    connectedAt,
    balanceKobo,
    rateKobo: config?.rateKobo ?? DEFAULT_RATE_KOBO,
    billingEnabled: config?.enabled ?? true,
    config,
    sessionChargedKobo,
    entries,
    freshId,
    ledgerLoading,
    hasMore: nextCursor !== null,
    loadMore,
  };
}
