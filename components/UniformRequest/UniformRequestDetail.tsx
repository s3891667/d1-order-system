"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UniformRequestDetail as RequestDetail } from "./types";
import { formatStatus, getStatusActions, getStatusBadgeClass, parseUniformType, VARIANT_CLASSES } from "./utils";


type Props = {
  requestId: number;
  onClose: () => void;
  onStatusChanged: (id: number, newStatus: string) => void;
  isAdmin?: boolean;
  onReorder?: (detail: RequestDetail, reorderReason: string) => void;
};

export default function UniformRequestDetail({ requestId, onClose, onStatusChanged, isAdmin = false, onReorder }: Props) {
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderReason, setReorderReason] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const openReorderModal = () => setShowReorderModal(true);
  const handleReorderSubmit = () => {
    if (!detail) return;
    onReorder?.(detail, reorderReason.trim());
    setShowReorderModal(false);
    setReorderReason("");
    handleClose();
  };

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError("");

    fetch(`/api/uniform/requests/${requestId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load request details.");
        return res.json() as Promise<RequestDetail>;
      })
      .then((data) => {
        if (!isMounted) return;
        setDetail(data);
        setNotesValue(data.notes ?? "");
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [requestId]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  const handleStatusAction = async (nextStatus: string) => {
    if (!detail) return;
    setActionError("");
    setPendingStatus(nextStatus);

    try {
      let res: Response;

      if (nextStatus === "CANCELLED" && !isAdmin) {
        res = await fetch(
          `/api/staff-management/staffs/${detail.requestedBy}/uniform-request/cancel`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId }),
          },
        );
      } else {
        res = await fetch(`/api/uniform/requests/${requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
      }

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to update status.");
      }

      const updated = (await res.json()) as RequestDetail;
      setDetail(updated);
      onStatusChanged(requestId, updated.status);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setPendingStatus(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!detail) return;
    setSavingNotes(true);
    setActionError("");

    try {
      const res = await fetch(`/api/uniform/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      });

      if (!res.ok) throw new Error("Failed to save notes.");
      const updated = (await res.json()) as RequestDetail;
      setDetail(updated);
      setEditingNotes(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingNotes(false);
    }
  };

  const actions = detail ? getStatusActions(detail.status, isAdmin) : [];
  const showReorder = isAdmin && detail !== null && detail.status === "COLLECTED";

  return (
    <>
      {/* Reorder reason modal */}
      {showReorderModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reorder-modal-title"
          >
            <h3 id="reorder-modal-title" className="text-base font-semibold text-slate-900">
              Input reason as to why a re-order is occurring
            </h3>
            <textarea
              value={reorderReason}
              onChange={(e) => setReorderReason(e.target.value)}
              rows={4}
              placeholder="e.g. Wrong size delivered, item damaged..."
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowReorderModal(false);
                  setReorderReason("");
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReorderSubmit}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Request to re-order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
        aria-label="Request detail"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Request Detail
            </h2>
            {detail && (
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(detail.status)}`}
              >
                {formatStatus(detail.status)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading && (
            <p className="text-sm text-slate-500">Loading request details…</p>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {!isLoading && !error && detail && (
            <div className="space-y-6">
              {/* Info grid */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Order Information
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-slate-500">EAN</dt>
                    <dd className="mt-0.5 font-mono text-slate-900">{detail.ean}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Tracking ID</dt>
                    <dd className="mt-0.5 font-mono text-slate-900">{detail.trackingId}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Staff</dt>
                    <dd className="mt-0.5 text-slate-900">
                      {detail.staff?.displayName ?? `Staff #${detail.requestedBy}`}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Role</dt>
                    <dd className="mt-0.5 text-slate-900">{detail.staff?.role ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Created</dt>
                    <dd className="mt-0.5 text-slate-900">
                      {new Date(detail.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-slate-500">Store</dt>
                    <dd className="mt-0.5 text-slate-900">{detail.storeName ?? "—"}</dd>
                  </div>
                </dl>
              </div>

              {/* Notes */}
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes
                  </h3>
                  {!editingNotes && (
                    <button
                      type="button"
                      onClick={() => { setEditingNotes(true); setNotesValue(detail.notes ?? ""); }}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                      placeholder="Add notes…"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {savingNotes ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingNotes(false)}
                        className="rounded-md border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700">
                    {detail.notes || <span className="italic text-slate-400">No notes added.</span>}
                  </p>
                )}
              </div>

              {/* Items table */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Requested Items ({detail.items.length})
                </h3>
                {detail.items.length === 0 ? (
                  <p className="text-sm italic text-slate-400">No items on this request.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="table-auto min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">Type</th>
                          <th className="px-3 py-2 text-center font-medium text-slate-600">Size</th>
                          <th className="w-16 px-3 py-2 text-right font-medium text-slate-600">Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {detail.items.map((item) => {
                          const { type, size } = parseUniformType(item.uniformType);
                          return (
                            <tr key={item.id}>
                              <td className="whitespace-nowrap px-3 py-2 text-slate-800">{type}</td>
                              <td className="whitespace-nowrap px-3 py-2 text-center text-slate-700">{size}</td>
                              <td className="w-16 whitespace-nowrap px-3 py-2 text-right font-medium text-slate-900">{item.quantity}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Status timeline */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status Timeline
                </h3>
                <ol className="flex items-center gap-0">
                  {["REQUEST", "DISPATCHED", "IN_TRANSIT", "ARRIVED", "COLLECTED"].map((s, idx, arr) => {
                    const statusOrder = ["REQUEST", "DISPATCHED", "IN_TRANSIT", "ARRIVED", "COLLECTED"];
                    const terminalDoneStatuses = ["COLLECTED"];
                    const currentIdx = statusOrder.indexOf(detail.status);
                    const thisIdx = statusOrder.indexOf(s);
                    const isDone = thisIdx <= currentIdx && detail.status !== "CANCELLED";
                    const isCurrent = s === detail.status && !terminalDoneStatuses.includes(detail.status);

                    return (
                      <li key={s} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${
                              isCurrent
                                ? "bg-indigo-600 text-white ring-2 ring-indigo-300 ring-offset-1"
                                : isDone
                                ? "bg-emerald-500 text-white"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {isDone ? (
                              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 3.293 9.879a1 1 0 111.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </span>
                          <span className={`mt-1 text-center text-[10px] leading-tight ${isCurrent ? "font-semibold text-indigo-700" : isDone ? "text-emerald-600" : "text-slate-400"}`}>
                            {formatStatus(s)}
                          </span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={`mx-1 mb-5 h-0.5 flex-1 ${thisIdx < currentIdx && detail.status !== "CANCELLED" ? "bg-emerald-400" : "bg-slate-200"}`} />
                        )}
                      </li>
                    );
                  })}
                </ol>
                {detail.status === "CANCELLED" && (
                  <p className="mt-2 text-xs font-medium text-red-500">This request has been archived / cancelled.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action footer */}
        {!isLoading && !error && detail && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            {actionError && (
              <p className="mb-3 text-xs text-red-600">{actionError}</p>
            )}

            {isAdmin && actions.length > 0 && (
              <div className="mb-3 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-medium text-amber-700">
                  Dispatch team hasn&apos;t updated? Use this to jump straight to collected.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {actions.length === 0 && !showReorder ? (
                <p className="text-sm text-slate-500">
                  {detail.status === "CANCELLED"
                    ? "This request is archived and can no longer be updated."
                    : "No further actions available."}
                </p>
              ) : (
                <>
                  {actions.length > 0 && (
                    <>
                      {actions.map((action) => (
                        <button
                          key={action.nextStatus}
                          type="button"
                          onClick={() => handleStatusAction(action.nextStatus)}
                          disabled={pendingStatus !== null}
                          className={`rounded-md px-4 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${VARIANT_CLASSES[action.variant]}`}
                        >
                          {pendingStatus === action.nextStatus ? "Updating…" : action.label}
                        </button>
                      ))}
                    </>
                  )}

                  {showReorder && (
                    <button
                      type="button"
                      onClick={openReorderModal}
                      className="ml-auto flex items-center gap-2 rounded-md border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      Re-order
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
