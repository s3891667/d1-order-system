"use client";

import type { ImportSummary } from "./types";

type Props = {
  summary: ImportSummary | null;
};

export default function ImportSummaryDisplay({ summary }: Props) {
  if (!summary) {
    return (
      <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        Import summary and errors will appear here after upload.
      </div>
    );
  }

  return (
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
  );
}
