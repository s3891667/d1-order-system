"use client";

import { useState } from "react";

type ImportSummary = {
  importType: "staff" | "stock";
  fileName: string | null;
  processedAt: string;
  total: number;
  valid: number;
  success: number;
  skipped?: number;
  failed: number;
};

type InvalidRow = {
  rowNumber: number;
  errors: string[];
  row: Record<string, string | undefined>;
};

type ImportType = "staff" | "stock";
const DUPLICATE_STAFF_ERROR = "Staff name already exists in the database.";
const LEGACY_DUPLICATE_STAFF_ERROR = "Staff already exists in this store.";

export default function ImportPanel() {
  const [importType, setImportType] = useState<ImportType>("staff");
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [invalidRows, setInvalidRows] = useState<InvalidRow[]>([]);
  const [loading, setLoading] = useState(false);

  const duplicateStaffRows = invalidRows.filter(
    (invalidRow) =>
      invalidRow.errors.length === 1 &&
      (invalidRow.errors[0] === DUPLICATE_STAFF_ERROR ||
        invalidRow.errors[0] === LEGACY_DUPLICATE_STAFF_ERROR)
  );
  const detailedInvalidRows = invalidRows.filter(
    (invalidRow) =>
      !(
        invalidRow.errors.length === 1 &&
        (invalidRow.errors[0] === DUPLICATE_STAFF_ERROR ||
          invalidRow.errors[0] === LEGACY_DUPLICATE_STAFF_ERROR)
      )
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setSummary(null);
      setErrors([]);
      setInvalidRows([]);
    }
  };

  const handleImportTypeChange = (type: ImportType) => {
    setImportType(type);
    setFile(null);
    setSummary(null);
    setErrors([]);
    setInvalidRows([]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    const endpoint = importType === "staff" ? "/api/import/staff" : "/api/import/stock";

    try {
      const res = await fetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data?.errors as string[] | undefined)?.[0] || "Upload failed");
      }

      setSummary(data.summary);
      setErrors(data.errors || []);
      setInvalidRows(data.invalidRows || []);
    } catch (err) {
      console.error(err);
      setSummary(null);
      setInvalidRows([]);
      setErrors([err instanceof Error ? err.message : "Upload failed"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-slate-900">Import Data</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => handleImportTypeChange("staff")}
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
              onClick={() => handleImportTypeChange("stock")}
              className={`rounded px-3 py-2 text-sm transition ${
                importType === "stock"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Stock Import
            </button>
          </div>

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
            onChange={handleFileChange}
            className="mb-4 w-full rounded border border-slate-300 bg-white p-2"
          />

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Uploading..." : `Upload ${importType === "staff" ? "Staff" : "Stock"} CSV`}
          </button>
        </div>

        <div className="space-y-4">
          {summary ? (
            <div className="rounded border bg-gray-50 p-4">
              <h3 className="mb-2 font-semibold">Import Summary</h3>
              <div className="mb-3 grid gap-2 text-sm sm:grid-cols-2">
                <p>
                  Type:{" "}
                  <span className="font-medium">
                    {summary.importType === "staff" ? "Staff" : "Stock"}
                  </span>
                </p>
                <p>
                  File: <span className="font-medium">{summary.fileName ?? "-"}</span>
                </p>
                <p className="sm:col-span-2">
                  Processed At:{" "}
                  <span className="font-medium">
                    {new Date(summary.processedAt).toLocaleString()}
                  </span>
                </p>
              </div>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <p>Total Rows: {summary.total}</p>
                <p>Valid Rows: {summary.valid}</p>
                <p>Successful: {summary.success}</p>
                <p>Skipped: {summary.skipped ?? 0}</p>
                <p>Failed: {summary.failed}</p>
              </div>
            </div>
          ) : (
            <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Import summary and errors will appear here after upload.
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded border border-red-200 bg-red-50 p-4">
              <h4 className="mb-1 font-semibold text-red-600">Errors:</h4>
              <ul className="list-inside list-disc text-red-500">
                {errors.map((err, idx) => (
                  <li key={`${err}-${idx}`}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {invalidRows.length > 0 && (
            <div className="rounded border border-amber-200 bg-amber-50 p-4">
              <h4 className="mb-2 font-semibold text-amber-700">Invalid Rows</h4>
              <div className="max-h-[420px] space-y-2 overflow-auto text-sm text-slate-800">
                {duplicateStaffRows.length > 0 && (
                  <div className="rounded border border-amber-200 bg-white p-3">
                    <p className="text-red-600">
                      {DUPLICATE_STAFF_ERROR}
                      {duplicateStaffRows.length > 1 ? ` (${duplicateStaffRows.length} rows)` : ""}
                    </p>
                  </div>
                )}
                {detailedInvalidRows.map((invalidRow) => (
                  <div key={invalidRow.rowNumber} className="rounded border border-amber-200 bg-white p-3">
                    <p className="font-medium">Row {invalidRow.rowNumber}</p>
                    <p className="text-red-600">{invalidRow.errors.join(", ")}</p>
                    <p className="mt-1 text-slate-600">
                      Data: {JSON.stringify(invalidRow.row)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
