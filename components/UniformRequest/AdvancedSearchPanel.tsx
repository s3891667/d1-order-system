"use client";

import type { AdvancedFilters } from "./types";
import { formatStatus, STATUS_OPTIONS } from "./utils";

type Props = {
  draftFilters: AdvancedFilters;
  onFieldChange: (field: keyof AdvancedFilters, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
};

export default function AdvancedSearchPanel({
  draftFilters,
  onFieldChange,
  onApply,
  onReset,
  onClose,
}: Props) {
  return (
    <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Filter Conditions</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          aria-label="Close search panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <FilterField label="EAN" value={draftFilters.ean} onChange={(v) => onFieldChange("ean", v)} placeholder="e.g. 5000112637922" />
        <FilterField label="Tracking ID" value={draftFilters.trackingId} onChange={(v) => onFieldChange("trackingId", v)} placeholder="e.g. TRK-ABC" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Status</label>
          <select
            value={draftFilters.status}
            onChange={(e) => onFieldChange("status", e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{formatStatus(s)}</option>
            ))}
          </select>
        </div>
        <FilterField label="Staff Name" value={draftFilters.staffName} onChange={(v) => onFieldChange("staffName", v)} placeholder="Search by name" />
        <FilterField label="Staff Role" value={draftFilters.staffRole} onChange={(v) => onFieldChange("staffRole", v)} placeholder="Search by role" />
        <FilterField label="Notes" value={draftFilters.notes} onChange={(v) => onFieldChange("notes", v)} placeholder="Keyword in notes" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Created From</label>
          <input
            type="date"
            value={draftFilters.dateFrom}
            onChange={(e) => onFieldChange("dateFrom", e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Created To</label>
          <input
            type="date"
            value={draftFilters.dateTo}
            onChange={(e) => onFieldChange("dateTo", e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-indigo-100 pt-4">
        <button
          type="button"
          onClick={onReset}
          className="text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
        >
          Reset all
        </button>
        <button
          type="button"
          onClick={onApply}
          className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

function FilterField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
      />
    </div>
  );
}
