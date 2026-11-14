"use client";

import { useSocket, type SocketStatus } from "@/lib/socket";

const LABEL: Record<SocketStatus, string> = {
  idle: "Offline",
  connecting: "Connecting…",
  online: "Live",
  offline: "Reconnecting…",
  rejected: "Rejected",
};

const DOT: Record<SocketStatus, string> = {
  idle: "bg-muted",
  connecting: "bg-warn nm-pulse",
  online: "bg-accent nm-pulse",
  offline: "bg-danger",
  rejected: "bg-danger",
};

export function ConnectionBadge() {
  const { status } = useSocket();
  return (
    <span
      role="status"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted"
    >
      <span className={`size-2 rounded-full ${DOT[status]}`} />
      {LABEL[status]}
    </span>
  );
}
