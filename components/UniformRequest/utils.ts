import { useEffect, useState } from "react";
import type {
  AdvancedFilters,
  StaffOption,
  StatusAction,
  StatusActionVariant,
  StockOption,
  UniformRequestFormValues,
  UniformRequestRecord,
} from "./types";

export function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "REQUEST":
      return "bg-blue-100 text-blue-700";
    case "DISPATCHED":
      return "bg-indigo-100 text-indigo-700";
    case "IN_TRANSIT":
      return "bg-violet-100 text-violet-700";
    case "ARRIVED":
      return "bg-amber-100 text-amber-800";
    case "COLLECTED":
      return "bg-emerald-100 text-emerald-700";
    case "COMPLETED":
      return "bg-teal-100 text-teal-700";
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export const VARIANT_CLASSES: Record<StatusActionVariant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-400",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400",
  warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400",
  danger: "border border-red-300 bg-white text-red-600 hover:bg-red-50 focus:ring-red-300",
  neutral: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300",
};

export function getStatusActions(status: string, isAdmin?: boolean): StatusAction[] {
  if (isAdmin) {
    const terminalStatuses = ["COLLECTED", "CANCELLED"];
    if (!terminalStatuses.includes(status)) {
      return [{ label: "Mark as Collected", nextStatus: "COLLECTED", variant: "success" }];
    }
    return [];
  }

  const actions: StatusAction[] = [];

  switch (status) {
    case "REQUEST":
      actions.push({ label: "Mark Dispatched", nextStatus: "DISPATCHED", variant: "primary" });
      actions.push({ label: "Archive (Cancel)", nextStatus: "CANCELLED", variant: "danger" });
      break;
    case "DISPATCHED":
      actions.push({ label: "Mark In Transit", nextStatus: "IN_TRANSIT", variant: "primary" });
      break;
    case "IN_TRANSIT":
      actions.push({ label: "Mark Arrived", nextStatus: "ARRIVED", variant: "warning" });
      break;
    case "ARRIVED":
      actions.push({ label: "Mark Collected", nextStatus: "COLLECTED", variant: "success" });
      break;
  }

  return actions;
}

export function parseUniformType(fullName: string): { type: string; size: string } {
  const match = fullName.trim().match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) return { type: match[1].trim(), size: match[2].trim() };
  return { type: fullName.trim(), size: "—" };
}

// --- Status view ---

export const EMPTY_FILTERS: AdvancedFilters = {
  ean: "",
  staffName: "",
  staffRole: "",
  trackingId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  notes: "",
};

export const STATUS_OPTIONS = [
  "REQUEST",
  "DISPATCHED",
  "IN_TRANSIT",
  "ARRIVED",
  "COLLECTED",
];

export function applyFilters(records: UniformRequestRecord[], filters: AdvancedFilters): UniformRequestRecord[] {
  return records.filter((r) => {
    if (filters.ean && !r.ean.toLowerCase().includes(filters.ean.toLowerCase())) return false;
    if (filters.trackingId && !r.trackingId.toLowerCase().includes(filters.trackingId.toLowerCase())) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (filters.staffName) {
      const name = r.staff?.displayName ?? "";
      if (!name.toLowerCase().includes(filters.staffName.toLowerCase())) return false;
    }
    if (filters.staffRole) {
      const role = r.staff?.role ?? "";
      if (!role.toLowerCase().includes(filters.staffRole.toLowerCase())) return false;
    }
    if (filters.notes && !(r.notes ?? "").toLowerCase().includes(filters.notes.toLowerCase())) return false;
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (new Date(r.createdAt) < from) return false;
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(r.createdAt) > to) return false;
    }
    return true;
  });
}

export function hasActiveFilters(filters: AdvancedFilters): boolean {
  return Object.values(filters).some((v) => v !== "");
}

// --- Form ---

export function useOptionsLoader<T>(loader: () => Promise<T[]>, emptyMessage: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      const result = await loader();

      if (!isMounted) return;

      setData(result);
      setError(result.length === 0 ? emptyMessage : "");
      setLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [loader, emptyMessage]);

  return { data, loading, error };
}

export const fetchStaff = async (): Promise<StaffOption[]> => {
  try {
    const res = await fetch("/api/staff-management/staffs");
    if (!res.ok) throw new Error("Failed to fetch staff");
    return (await res.json()) as StaffOption[];
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
};

export const fetchUniformStock = async (): Promise<StockOption[]> => {
  try {
    const res = await fetch("/api/uniform/stock");
    if (!res.ok) throw new Error("Failed to fetch uniform stock");
    return (await res.json()) as StockOption[];
  } catch (error) {
    console.error("Error fetching uniform stock:", error);
    return [];
  }
};

export const INITIAL_FORM_VALUES: UniformRequestFormValues = {
  staffRole: "",
  staffMember: "",
  uniformLimit: 1,
  ean: "",
  name: "",
  quantity: 1,
  notes: "",
};
