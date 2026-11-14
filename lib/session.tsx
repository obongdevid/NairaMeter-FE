"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import type { Me } from "./types";

const STORAGE_KEY = "nm_user_id";

interface SessionValue {
  /** "loading" until we've checked for a remembered user. */
  status: "loading" | "signed-out" | "signed-in";
  userId: string | null;
  me: Me | null;
  signIn: (userId: string) => Promise<Me>;
  signOut: () => void;
  refreshMe: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

function remember(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * DEV-ONLY identity: "signing in" means picking a seeded user. The backend
 * trusts the id we send, so swap this provider out when real login ships.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionValue["status"]>("loading");
  const [userId, setUserId] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  const signOut = useCallback(() => {
    remember(null);
    setUserId(null);
    setMe(null);
    setStatus("signed-out");
  }, []);

  const signIn = useCallback(async (id: string) => {
    const profile = await api<Me>("/me", { userId: id });
    remember(id);
    setUserId(id);
    setMe(profile);
    setStatus("signed-in");
    return profile;
  }, []);

  const refreshMe = useCallback(async () => {
    if (!userId) return;
    setMe(await api<Me>("/me", { userId }));
  }, [userId]);

  // Restore a remembered user on first load.
  useEffect(() => {
    let id: string | null = null;
    try {
      id = localStorage.getItem(STORAGE_KEY);
    } catch {}
    if (!id) {
      setStatus("signed-out");
      return;
    }
    signIn(id).catch(signOut);
  }, [signIn, signOut]);

  const value = useMemo(
    () => ({ status, userId, me, signIn, signOut, refreshMe }),
    [status, userId, me, signIn, signOut, refreshMe],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
