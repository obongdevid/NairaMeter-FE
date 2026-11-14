"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { useSocket } from "./socket";
import type { BillingSettings, LedgerEntry, Me, TransactionType } from "./types";

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
  const [settings, setSettings] = useState<BillingSettings>(me.billing);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [sessionChargedKobo, setSessionChargedKobo] = useState(0);
  const [freshId, setFreshId] = useState<string | null>(null);

  // (Re)load the ledger and billing rules on mount and after every reconnect,
  // so anything missed while offline shows up.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<LedgerPage>("/transactions?limit=30", { userId: me.id }),
      api<Me>("/me", { userId: me.id }),
    ])
      .then(([page, fresh]) => {
        if (cancelled) return;
        setEntries(page.items);
        setNextCursor(page.nextCursor);
        setSettings(fresh.billing);
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
                description: type === "TOPUP" ? "Wallet top-up" : "Usage charge",
              },
              ...prev,
            ],
      );
    };
    const onConfig = (c: BillingSettings) => setSettings(c);
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

  const lastDebit = entries.find((e) => e.type === "DEBIT");

  return {
    online: status === "online",
    connectedAt,
    balanceKobo,
    settings,
    lastDebitAt: lastDebit ? new Date(lastDebit.createdAt).getTime() : null,
    sessionChargedKobo,
    entries,
    freshId,
    ledgerLoading,
    hasMore: nextCursor !== null,
    loadMore,
  };
}
