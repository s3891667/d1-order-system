"use client";

import { useEffect, useState } from "react";

export function useSessionRole() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const res = await fetch("/api/session/current", { credentials: "include" });
      if (!res.ok) return;
      const body = (await res.json()) as { user?: { role?: string } | null };
      setRole(body.user?.role ?? null);
    };
    loadSession();
  }, []);

  return { role, isDispatchAdmin: role === "dispatchAdmin" };
}
