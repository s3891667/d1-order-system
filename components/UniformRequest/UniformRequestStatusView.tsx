"use client";

import { useState } from "react";
import UniformRequestDetail from "./UniformRequestDetail";
import type { AdvancedFilters, UniformRequestDetail as UniformRequestDetailType, UniformRequestFormValues } from "./types";
import { applyFilters, EMPTY_FILTERS, formatStatus, hasActiveFilters } from "./utils";
import { useUniformRequests } from "@/hooks/useUniformRequests";
import AdvancedSearchPanel from "./AdvancedSearchPanel";
import RequestStatusTable from "./RequestStatusTable";

type Props = {
  isDispatchAdmin?: boolean;
  onReorder?: (values: Partial<UniformRequestFormValues>) => void;
  /** When false, the page title/description header is hidden (assumed rendered by the page) */
  showHeader?: boolean;
};

export default function UniformRequestStatusView({ isDispatchAdmin = false, onReorder, showHeader = true }: Props) {
  const { requests, isLoading, error, handleStatusChanged } = useUniformRequests();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters>(EMPTY_FILTERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);

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

  const removeFilter = (key: keyof AdvancedFilters) => {
    const next = { ...appliedFilters, [key]: "" };
    setAppliedFilters(next);
    setDraftFilters(next);
  };

  const handleReorder = onReorder
    ? (detail: UniformRequestDetailType, reorderReason: string) => {
        onReorder({
          staffRole: detail.staff?.role as UniformRequestFormValues["staffRole"],
          staffMember: String(detail.requestedBy),
          ean: detail.ean,
          name: detail.items?.[0]?.uniformType ?? detail.ean,
          quantity: detail.quantity,
          notes: reorderReason ? `Re-order reason: ${reorderReason}` : "",
        });
        setSelectedId(null);
      }
    : undefined;

  const visibleRequests = hasActiveFilters(appliedFilters)
    ? applyFilters(requests, appliedFilters)
    : requests;

  const activeCount = Object.values(appliedFilters).filter((v) => v !== "").length;

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm">
      {/* Header (title + Advanced Search button) */}
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-start ${showHeader ? "sm:justify-between" : "sm:justify-end"}`}>
        {showHeader && (
          <div>
            <h2 className="text-lg font-semibold">Track Request Status</h2>
            <p className="mt-1 text-sm text-slate-600">
              Simple view of all uniform requests and their current status.
            </p>
          </div>
        )}

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
        <AdvancedSearchPanel
          draftFilters={draftFilters}
          onFieldChange={setField}
          onApply={handleApply}
          onReset={handleReset}
          onClose={() => setIsSearchOpen(false)}
        />
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
                  onClick={() => removeFilter(key as keyof AdvancedFilters)}
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
        <>
          {hasActiveFilters(appliedFilters) && (
            <p className="mb-2 text-xs text-slate-500">
              Showing {visibleRequests.length} of {requests.length} requests
            </p>
          )}
          <RequestStatusTable
            requests={visibleRequests}
            onRowClick={setSelectedId}
          />
        </>
      )}

      {selectedId !== null && (
        <UniformRequestDetail
          requestId={selectedId}
          onClose={() => setSelectedId(null)}
          onStatusChanged={handleStatusChanged}
          isAdmin={!isDispatchAdmin}
          onReorder={handleReorder}
        />
      )}
    </section>
  );
}
