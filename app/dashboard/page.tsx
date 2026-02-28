"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AppRole = "admin" | "dispatchAdmin";

export default function DashboardPage() {
  const router = useRouter();
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      const res = await fetch("/api/session/current", { credentials: "include" });
      if (!res.ok) {
        router.replace("/dashboard/track-status");
        return;
      }

      const body = (await res.json()) as {
        authenticated: boolean;
        user?: { role?: AppRole } | null;
      };
      const role = body.authenticated ? body.user?.role ?? null : null;

      if (role === "dispatchAdmin") {
        router.replace("/dashboard/track-status");
      } else {
        router.replace("/dashboard/import");
      }
      setResolved(true);
    };

    loadSession();
  }, [router]);

  if (!resolved) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  return null;
}
