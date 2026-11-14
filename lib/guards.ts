"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "./session";
import type { Role } from "./types";

export function homeFor(role: Role) {
  return role === "ADMIN" ? "/admin" : "/wallet";
}

/** Redirects to / if signed out, or to the user's own home if the role is wrong. */
export function useRequireRole(role: Role) {
  const { status, me } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "signed-out") router.replace("/");
    else if (status === "signed-in" && me && me.role !== role) {
      router.replace(homeFor(me.role));
    }
  }, [status, me, role, router]);

  return status === "signed-in" && me?.role === role ? me : null;
}
