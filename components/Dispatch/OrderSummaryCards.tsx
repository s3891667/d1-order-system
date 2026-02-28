"use client";

import { ShoppingCart, CheckCircle } from "lucide-react";

type Props = {
  total: number | null;
  completed: number | null;
  inDispatch: number | null;
  pendingApprovals: number | null;
};

export default function OrderSummaryCards({
  total,
  completed,
  inDispatch,
  pendingApprovals,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Sales Orders" value={total} icon={ShoppingCart} iconBg="bg-blue-50" iconColor="text-blue-500" />
      <SummaryCard label="Completed Orders" value={completed} icon={CheckCircle} iconBg="bg-emerald-50" iconColor="text-emerald-500" />
      <SummaryCard label="In Dispatch" value={inDispatch} badge="Live" badgeClass="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700" />
      <SummaryCard label="Pending Approvals" value={pendingApprovals} badge="Action needed" badgeClass="rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700" />
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number | null;
} & (
  | { icon: typeof ShoppingCart; iconBg: string; iconColor: string; badge?: never; badgeClass?: never }
  | { badge: string; badgeClass: string; icon?: never; iconBg?: never; iconColor?: never }
);

function SummaryCard({ label, value, ...rest }: SummaryCardProps) {
  const Icon = "icon" in rest ? rest.icon : null;
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value ?? "--"}</p>
        </div>
        {Icon && "iconBg" in rest ? (
          <div className={`rounded-full ${rest.iconBg} p-2`}>
            <Icon className={`h-5 w-5 ${rest.iconColor}`} />
          </div>
        ) : "badge" in rest && rest.badge ? (
          <span className={rest.badgeClass}>{rest.badge}</span>
        ) : null}
      </div>
    </div>
  );
}
