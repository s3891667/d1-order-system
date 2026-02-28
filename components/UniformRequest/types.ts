import type { StaffRole, StockItem } from "@/generated/prisma/browser";

export type StaffSummary = {
  displayName: string;
  role: string;
};

export type StatusActionVariant = "primary" | "success" | "warning" | "danger" | "neutral";

export type StatusAction = {
  label: string;
  nextStatus: string;
  variant: StatusActionVariant;
};

export type UniformRequestItem = {
  id: number;
  uniformType: string;
  size: string;
  quantity: number;
  remarks: string | null;
};

export type UniformRequestRecord = {
  id: number;
  ean: string;
  trackingId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  requestedBy: number;
  staff: StaffSummary | null;
};

export type UniformRequestDetail = UniformRequestRecord & {
  quantity: number;
  storeName: string | null;
  items: UniformRequestItem[];
};

export type AdvancedFilters = {
  ean: string;
  staffName: string;
  staffRole: string;
  trackingId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  notes: string;
};

export type UniformRequestFormValues = {
  staffRole: StaffRole | "";
  staffMember: string;
  uniformLimit: number;
  ean: string;
  name: string;
  quantity: number;
  notes: string;
};

export type StaffOption = {
  id: number;
  displayName: string;
  role: StaffRole;
  uniformLimit: number | null;
};

export type StockOption = Pick<StockItem, "ean" | "name" | "qty">;

export type CooldownStatus = {
  canRequest: boolean;
  nextAllowedAt: string | null;
  uniformLimit: number | null;
  totalOrdered: number;
  totalRequests: number;
  remaining: number | null;
};
