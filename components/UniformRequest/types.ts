export type StaffSummary = {
  displayName: string;
  role: string;
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
  requestNo: string;
  trackingId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  requestedBy: number;
  staff: StaffSummary | null;
};

export type UniformRequestDetail = UniformRequestRecord & {
  items: UniformRequestItem[];
};

export type AdvancedFilters = {
  requestNo: string;
  staffName: string;
  staffRole: string;
  trackingId: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  notes: string;
};
