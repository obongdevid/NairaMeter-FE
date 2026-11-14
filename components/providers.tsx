"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/session";
import { SocketProvider } from "@/lib/socket";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SocketProvider>{children}</SocketProvider>
    </SessionProvider>
  );
}
