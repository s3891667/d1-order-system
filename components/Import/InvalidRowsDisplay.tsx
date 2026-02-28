"use client";

import type { InvalidRow } from "./types";
import { DUPLICATE_STAFF_ERROR, LEGACY_DUPLICATE_STAFF_ERROR } from "./types";

type Props = {
  invalidRows: InvalidRow[];
};

const isDuplicateStaffRow = (invalidRow: InvalidRow) =>
  invalidRow.errors.length === 1 &&
  (invalidRow.errors[0] === DUPLICATE_STAFF_ERROR ||
    invalidRow.errors[0] === LEGACY_DUPLICATE_STAFF_ERROR);

export default function InvalidRowsDisplay({ invalidRows }: Props) {
  if (invalidRows.length === 0) return null;

  const duplicateStaffRows = invalidRows.filter(isDuplicateStaffRow);
  const detailedInvalidRows = invalidRows.filter((r) => !isDuplicateStaffRow(r));

  return (
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
  );
}
