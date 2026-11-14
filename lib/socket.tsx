"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "./api";
import { useSession } from "./session";

export type SocketStatus = "idle" | "connecting" | "online" | "offline" | "rejected";

interface SocketValue {
  socket: Socket | null;
  status: SocketStatus;
  /** When the server accepted this connection (ms epoch). Null unless online. */
  connectedAt: number | null;
  /** Balance reported by the server in the connection handshake. */
  handshakeBalanceKobo: number | null;
}

const EMPTY: SocketValue = {
  socket: null,
  status: "idle",
  connectedAt: null,
  handshakeBalanceKobo: null,
};

const SocketContext = createContext<SocketValue>(EMPTY);

/**
 * Holds one socket per signed-in user. Being connected is what makes the
 * backend consider the user "online" and bill them each minute.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { userId } = useSession();
  const [value, setValue] = useState<SocketValue>(EMPTY);

  useEffect(() => {
    if (!userId) {
      setValue(EMPTY);
      return;
    }
    const socket = io(API_URL, {
      auth: { userId },
      transports: ["websocket"],
    });
    const set = (status: SocketStatus, extra: Partial<SocketValue> = {}) =>
      setValue((prev) => ({
        socket,
        status,
        connectedAt: prev.socket === socket ? prev.connectedAt : null,
        handshakeBalanceKobo: prev.socket === socket ? prev.handshakeBalanceKobo : null,
        ...extra,
      }));

    set("connecting");
    socket.on("connected", (d: { balanceKobo: number }) =>
      set("online", { connectedAt: Date.now(), handshakeBalanceKobo: d.balanceKobo }),
    );
    socket.on("disconnect", () => set("offline", { connectedAt: null }));
    socket.io.on("reconnect_attempt", () => set("connecting", { connectedAt: null }));
    socket.on("connect_error", () => set("offline", { connectedAt: null }));
    socket.on("auth:error", () => set("rejected", { connectedAt: null }));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [userId]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
