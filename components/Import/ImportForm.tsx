"use client";

import type { ImportType } from "./types";

type Props = {
  importType: ImportType;
  onImportTypeChange: (type: ImportType) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  disabled: boolean;
  loading: boolean;
  canImportStaff?: boolean;
  canImportStock?: boolean;
};

export default function ImportForm({
  importType,
  onImportTypeChange,
  onFileChange,
  onUpload,
  disabled,
  loading,
  canImportStaff = true,
  canImportStock = true,
}: Props) {
  const showToggle = canImportStaff && canImportStock;
  const hasAnyPermission = canImportStaff || canImportStock;

  if (!hasAnyPermission) {
    return (
      <div className="rounded border border-slate-200 bg-slate-50 p-4">
        <p className="text-slate-600">You don&apos;t have permission to import data.</p>
      </div>
    );
  }

  return (
    <div className="rounded border border-slate-200 bg-slate-50 p-4">
      {showToggle && (
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => onImportTypeChange("staff")}
            className={`rounded px-3 py-2 text-sm transition ${
              importType === "staff"
                ? "bg-blue-600 text-white"
                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Staff Import
          </button>
          <button
            type="button"
            onClick={() => onImportTypeChange("stock")}
            className={`rounded px-3 py-2 text-sm transition ${
              importType === "stock"
                ? "bg-blue-600 text-white"
                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Stock Import
          </button>
        </div>
      )}

      <div className="mb-4 rounded border border-slate-200 bg-white p-3 text-sm text-slate-700">
        {importType === "staff" ? (
          <p>
            Required headers:{" "}
            <span className="font-medium">Display Name, Role, Store</span>
          </p>
        ) : (
          <p>
            Required headers: <span className="font-medium">EAN, Name, Qty</span>
          </p>
        )}
      </div>

      <input
        type="file"
        accept=".csv"
        onChange={onFileChange}
        className="mb-4 w-full rounded border border-slate-300 bg-white p-2"
      />

      <button
        onClick={onUpload}
        disabled={disabled || loading}
        className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? "Uploading..." : `Upload ${importType === "staff" ? "Staff" : "Stock"} CSV`}
      </button>
    </div>
  );
}
