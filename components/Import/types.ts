export type ImportType = "staff" | "stock";

export type ImportSummary = {
  importType: ImportType;
  fileName: string | null;
  processedAt: string;
  total: number;
  valid: number;
  success: number;
  skipped?: number;
  failed: number;
};

export type InvalidRow = {
  rowNumber: number;
  errors: string[];
  row: Record<string, string | undefined>;
};

export const DUPLICATE_STAFF_ERROR = "Staff name already exists in the database.";
export const LEGACY_DUPLICATE_STAFF_ERROR = "Staff already exists in this store.";
