"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type AppRole = "admin" | "dispatchAdmin";

const ROUTES = {
  import: "/dashboard/import",
  createRequest: "/dashboard/create-request",
  trackStatus: "/dashboard/track-status",
  orders: "/dashboard/orders",
  stocks: "/dashboard/stocks",
} as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const isDispatchAdmin = role === "dispatchAdmin";

  useEffect(() => {
    const loadSession = async () => {
      const res = await fetch("/api/session/current", { credentials: "include" });
      if (!res.ok) {
        setRole(null);
        return;
      }

      const body = (await res.json()) as {
        authenticated: boolean;
        user?: { role?: AppRole } | null;
      };
      setRole(body.authenticated ? body.user?.role ?? null : null);
    };

    loadSession();
  }, []);

  const menuLinkClass = (path: string) =>
    `block w-full rounded-md px-3 py-2 text-left text-sm ${
      pathname === path ? "bg-slate-100 font-medium text-slate-900" : "hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle dashboard menu"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="rounded-md border border-slate-300 p-2 transition hover:bg-slate-100"
          >
            <span className="block h-0.5 w-5 bg-slate-800" />
            <span className="mt-1 block h-0.5 w-5 bg-slate-800" />
            <span className="mt-1 block h-0.5 w-5 bg-slate-800" />
          </button>
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
        <span className="text-sm text-slate-500">
          {isDispatchAdmin ? "Welcome, Dispatch Admin" : "Welcome, Admin"}
        </span>
      </header>

      <div className="flex min-h-[calc(100vh-57px)]">
        <aside
          className={`${
            isSidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0"
          } shrink-0 overflow-hidden border-t border-slate-300 bg-white shadow-md transition-all duration-300 ease-in-out`}
        >
          <div className="w-64 p-4">
            <nav className="space-y-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Menu
              </p>
                <Link
                  href={ROUTES.import}
                  className={menuLinkClass(ROUTES.import)}
                >
                  Import Data
                </Link>
              {!isDispatchAdmin && (
                <Link
                  href={ROUTES.createRequest}
                  className={menuLinkClass(ROUTES.createRequest)}
                >
                  Create Uniform Request
                </Link>
              )}
              <Link
                href={ROUTES.trackStatus}
                className={menuLinkClass(ROUTES.trackStatus)}
              >
                Track Request Status
              </Link>
              {isDispatchAdmin && (
                <>
                  <Link
                    href={ROUTES.stocks}
                    className={menuLinkClass(ROUTES.stocks)}
                  >
                    Stock Inventory
                  </Link>
                  <Link
                    href={ROUTES.orders}
                    className={menuLinkClass(ROUTES.orders)}
                  >
                    Orders Management
                  </Link>
                </>
              )}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
