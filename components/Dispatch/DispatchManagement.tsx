"use client";

import { useOrdersStats } from "@/hooks/useOrdersStats";
import OrderSummaryCards from "./OrderSummaryCards";
import OrdersLinechart from "./OrdersLinechart";

export default function DispatchManagement() {
  const { total, completed, inDispatch, pendingApprovals } = useOrdersStats();

  return (
    <div>
      <section className="space-y-6">
        <header className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Dispatch Dashboard</h2>
            <p className="text-sm text-slate-500">
              High‑level view for dispatch admin. You can plug in your own data and widgets here.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              Today&apos;s Snapshot
            </span>
          </div>
        </header>

        <OrderSummaryCards
          total={total}
          completed={completed}
          inDispatch={inDispatch}
          pendingApprovals={pendingApprovals}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Orders Overview</h3>
              <div className="flex gap-1 text-xs text-slate-500">
                <button className="rounded-full bg-slate-900 px-3 py-1 text-white">Weekly</button>
                <button className="rounded-full px-3 py-1 hover:bg-slate-100">Monthly</button>
                <button className="rounded-full px-3 py-1 hover:bg-slate-100">Yearly</button>
              </div>
            </div>
            <div className="mt-4 h-64 rounded-md border border-slate-200 bg-slate-50 p-3">
              <OrdersLinechart />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Dispatch</h3>
              <span className="text-xs text-slate-500">Weekly</span>
            </div>
            <div className="mt-4 flex h-32 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
              Placeholder for dispatch bars
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Resources</h3>
              <span className="text-xs text-slate-500">Summary</span>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-slate-600">
              {["Resource 1", "Resource 2", "Resource 3", "Resource 4"].map((name) => (
                <li key={name} className="flex items-center justify-between">
                  <span className="truncate">{name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">--</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
