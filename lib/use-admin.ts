"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useSocket } from "./socket";
import type {
  AdminUser,
  BillingConfig,
  BillingPatch,
  FeedItem,
  TransactionType,
} from "./types";

const FEED_LIMIT = 100;

interface RecentTx {
  id: string;
  type: TransactionType;
  amountKobo: number;
  balanceAfterKobo: number;
  createdAt: string;
  user: { id: string; name: string };
}

/** Live admin state: customers, presence, billing config and the activity feed. */
export function useAdmin(adminId: string) {
  const { socket, connectedAt } = useSocket();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [collectedKobo, setCollectedKobo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Event handlers need names for events that only carry a userId.
  const usersRef = useRef<AdminUser[]>([]);
  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  // Load on mount, and again after every reconnect to catch anything missed.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<AdminUser[]>("/admin/users", { userId: adminId }),
      api<RecentTx[]>("/admin/transactions?limit=50", { userId: adminId }),
    ])
      .then(([u, tx]) => {
        if (cancelled) return;
        setUsers(u);
        setFeed(
          tx.map((t) => ({
            id: t.id,
            kind: t.type,
            userId: t.user.id,
            name: t.user.name,
            amountKobo: t.amountKobo,
            balanceAfterKobo: t.balanceAfterKobo,
            at: t.createdAt,
          })),
        );
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [adminId, connectedAt]);

  useEffect(() => {
    if (!socket) return;

    const patchUser = (id: string, patch: Partial<AdminUser>) =>
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    const pushFeed = (item: FeedItem) =>
      setFeed((prev) => [item, ...prev].slice(0, FEED_LIMIT));

    const onOnline = (d: { userId: string; balanceKobo: number }) =>
      patchUser(d.userId, { online: true, balanceKobo: d.balanceKobo });
    const onOffline = (d: { userId: string }) => patchUser(d.userId, { online: false });

    const onDebit = (d: {
      userId: string;
      name: string;
      amountKobo: number;
      balanceAfterKobo: number;
      at: string;
    }) => {
      patchUser(d.userId, { balanceKobo: d.balanceAfterKobo });
      setCollectedKobo((c) => c + d.amountKobo);
      pushFeed({
        id: `debit-${d.userId}-${d.at}`,
        kind: "DEBIT",
        userId: d.userId,
        name: d.name,
        amountKobo: d.amountKobo,
        balanceAfterKobo: d.balanceAfterKobo,
        at: d.at,
      });
    };

    const onTopup = (d: {
      userId: string;
      amountKobo: number;
      balanceAfterKobo: number;
      at: string;
    }) => {
      patchUser(d.userId, { balanceKobo: d.balanceAfterKobo });
      pushFeed({
        id: `topup-${d.userId}-${d.at}`,
        kind: "TOPUP",
        userId: d.userId,
        name: usersRef.current.find((u) => u.id === d.userId)?.name ?? "A customer",
        amountKobo: d.amountKobo,
        balanceAfterKobo: d.balanceAfterKobo,
        at: d.at,
      });
    };

    const onConfig = (c: BillingConfig) => patchUser(c.userId, { billingConfig: c });

    socket.on("presence:online", onOnline);
    socket.on("presence:offline", onOffline);
    socket.on("debit:created", onDebit);
    socket.on("topup:created", onTopup);
    socket.on("billing:config-updated", onConfig);
    return () => {
      socket.off("presence:online", onOnline);
      socket.off("presence:offline", onOffline);
      socket.off("debit:created", onDebit);
      socket.off("topup:created", onTopup);
      socket.off("billing:config-updated", onConfig);
    };
  }, [socket]);

  const updateBilling = useCallback(
    async (userId: string, patch: BillingPatch) => {
      const updated = await api<BillingConfig>(`/admin/users/${userId}/billing`, {
        method: "PATCH",
        userId: adminId,
        body: patch,
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, billingConfig: updated } : u)));
    },
    [adminId],
  );

  return { users, feed, collectedKobo, loading, error, updateBilling };
}
