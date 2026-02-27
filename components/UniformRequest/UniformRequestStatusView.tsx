"use client";

import { useEffect, useRef, useState } from "react";
import UniformRequestDetail from "./UniformRequestDetail";
import type { AdvancedFilters, UniformRequestRecord } from "./types";
import { formatStatus, getStatusBadgeClass } from "./utils";

const EMPTY_FILTERS: AdvancedFilters = {
  requestNo: "",
  staffName: "",
  staffRole: "",
  trackingId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  notes: "",
};

const STATUS_OPTIONS = [
  "REQUEST",
  "DISPATCHED",
  "IN_TRANSIT",
  "ARRIVED",
  "COLLECTED",
];

function applyFilters(records: UniformRequestRecord[], filters: AdvancedFilters): UniformRequestRecord[] {
  return records.filter((r) => {
    if (filters.requestNo && !r.requestNo.toLowerCase().includes(filters.requestNo.toLowerCase())) return false;
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

function hasActiveFilters(filters: AdvancedFilters): boolean {
  return Object.values(filters).some((v) => v !== "");
}

type Props = {
  isDispatchAdmin?: boolean;
};

export default function UniformRequestStatusView({ isDispatchAdmin = false }: Props) {
  const [requests, setRequests] = useState<UniformRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch("/api/uniform/requests");
        if (!res.ok) throw new Error("Failed to fetch request list.");
        const data = (await res.json()) as UniformRequestRecord[];
        if (!isMounted) return;
        setRequests(data);
      } catch (fetchError) {
        if (!isMounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load requests.");
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    loadRequests();
    return () => { isMounted = false; };
  }, []);

  const handleApply = () => {
    setAppliedFilters({ ...draftFilters });
    setIsSearchOpen(false);
  };

  const handleReset = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  const setField = (field: keyof AdvancedFilters, value: string) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatusChanged = (id: number, newStatus: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  const visibleRequests = hasActiveFilters(appliedFilters)
    ? applyFilters(requests, appliedFilters)
    : requests;

  const activeCount = Object.values(appliedFilters).filter((v) => v !== "").length;

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Track Request Status</h2>
          <p className="mt-1 text-sm text-slate-600">
            Simple view of all uniform requests and their current status.
          </p>
        </div>

        {isDispatchAdmin && (
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            className={`flex shrink-0 items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition ${
              isSearchOpen || activeCount > 0
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            Advanced Search
            {activeCount > 0 && (
              <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {activeCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Advanced Search Panel */}
      {isDispatchAdmin && isSearchOpen && (
        <div
          ref={panelRef}
          className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/40 p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Filter Conditions</h3>
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              aria-label="Close search panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* Request No */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Request No</label>
              <input
                type="text"
                value={draftFilters.requestNo}
                onChange={(e) => setField("requestNo", e.target.value)}
                placeholder="e.g. REQ-001"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            {/* Tracking ID */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Tracking ID</label>
              <input
                type="text"
                value={draftFilters.trackingId}
                onChange={(e) => setField("trackingId", e.target.value)}
                placeholder="e.g. TRK-ABC"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Status</label>
              <select
                value={draftFilters.status}
                onChange={(e) => setField("status", e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{formatStatus(s)}</option>
                ))}
              </select>
            </div>

            {/* Staff Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Staff Name</label>
              <input
                type="text"
                value={draftFilters.staffName}
                onChange={(e) => setField("staffName", e.target.value)}
                placeholder="Search by name"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            {/* Staff Role */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Staff Role</label>
              <input
                type="text"
                value={draftFilters.staffRole}
                onChange={(e) => setField("staffRole", e.target.value)}
                placeholder="Search by role"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Notes</label>
              <input
                type="text"
                value={draftFilters.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Keyword in notes"
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            {/* Date From */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Created From</label>
              <input
                type="date"
                value={draftFilters.dateFrom}
                onChange={(e) => setField("dateFrom", e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>

            {/* Date To */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Created To</label>
              <input
                type="date"
                value={draftFilters.dateTo}
                onChange={(e) => setField("dateTo", e.target.value)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-between border-t border-indigo-100 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              Reset all
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {isDispatchAdmin && activeCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Active filters:</span>
          {Object.entries(appliedFilters).map(([key, val]) =>
            val ? (
              <span
                key={key}
                className="flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
              >
                <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className="text-indigo-500">:</span>
                <span>{key === "status" ? formatStatus(val) : val}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...appliedFilters, [key]: "" };
                    setAppliedFilters(next);
                    setDraftFilters(next);
                  }}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-200"
                  aria-label={`Remove ${key} filter`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ) : null
          )}
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Clear all
          </button>
        </div>
      )}

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading requests...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && visibleRequests.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          {hasActiveFilters(appliedFilters)
            ? "No requests match the current filters."
            : "No uniform requests found yet."}
        </p>
      )}

      {!isLoading && !error && visibleRequests.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          Click on any row to open the order detail and take action.
        </p>
      )}

      {!isLoading && !error && visibleRequests.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          {hasActiveFilters(appliedFilters) && (
            <p className="mb-2 text-xs text-slate-500">
              Showing {visibleRequests.length} of {requests.length} requests
            </p>
          )}
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Request No</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Staff</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Role</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Tracking</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Created</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleRequests.map((request) => (
                <tr
                  key={request.id}
                  onClick={() => setSelectedId(request.id)}
                  className="cursor-pointer transition hover:bg-indigo-50/60"
                >
                  <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                    <span className="flex items-center gap-1.5">
                      {request.requestNo}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                    {request.staff?.displayName ?? `Staff #${request.requestedBy}`}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">{request.staff?.role ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">{request.trackingId}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(request.status)}`}
                    >
                      {formatStatus(request.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {new Date(request.createdAt).toLocaleString()}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-slate-700">{request.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedId !== null && (
        <UniformRequestDetail
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChanged={handleStatusChanged}
          isAdmin={!isDispatchAdmin}
        />
      )}
    </section>
  );
}
