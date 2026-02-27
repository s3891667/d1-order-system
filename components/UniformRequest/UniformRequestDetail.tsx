"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UniformRequestDetail as RequestDetail } from "./types";
import { formatStatus, getStatusBadgeClass } from "./utils";

type Props = {
  requestId: number;
  onClose: () => void;
  onStatusChanged: (id: number, newStatus: string) => void;
};

type StatusAction = {
  label: string;
  nextStatus: string;
  variant: "primary" | "success" | "warning" | "danger" | "neutral";
};

function getStatusActions(status: string): StatusAction[] {
  const actions: StatusAction[] = [];

  switch (status) {
    case "REQUEST":
      actions.push({ label: "Mark Dispatched", nextStatus: "DISPATCHED", variant: "primary" });
      break;
    case "DISPATCHED":
      actions.push({ label: "Mark In Transit", nextStatus: "IN_TRANSIT", variant: "primary" });
      break;
    case "IN_TRANSIT":
      actions.push({ label: "Mark Arrived", nextStatus: "ARRIVED", variant: "warning" });
      break;
    case "ARRIVED":
      actions.push({ label: "Mark Collected", nextStatus: "COLLECTED", variant: "success" });
      break;
    case "COLLECTED":
      actions.push({ label: "Mark Completed", nextStatus: "COMPLETED", variant: "success" });
      break;
  }

  if (status !== "CANCELLED" && status !== "COMPLETED" && status !== "COLLECTED") {
    actions.push({ label: "Archive (Cancel)", nextStatus: "CANCELLED", variant: "danger" });
  }

  return actions;
}

const VARIANT_CLASSES: Record<StatusAction["variant"], string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-400",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-400",
  warning:
    "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400",
  danger:
    "border border-red-300 bg-white text-red-600 hover:bg-red-50 focus:ring-red-300",
  neutral:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300",
};

export default function UniformRequestDetail({ requestId, onClose, onStatusChanged }: Props) {
  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

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
      const res = await fetch(`/api/uniform/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status.");
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

  const actions = detail ? getStatusActions(detail.status) : [];

  return (
    <>
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
                    <dt className="font-medium text-slate-500">Request No</dt>
                    <dd className="mt-0.5 font-mono text-slate-900">{detail.requestNo}</dd>
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
                  <div className="col-span-2">
                    <dt className="font-medium text-slate-500">Created</dt>
                    <dd className="mt-0.5 text-slate-900">
                      {new Date(detail.createdAt).toLocaleString()}
                    </dd>
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
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">Type</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">Size</th>
                          <th className="px-3 py-2 text-right font-medium text-slate-600">Qty</th>
                          <th className="px-3 py-2 text-left font-medium text-slate-600">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {detail.items.map((item) => (
                          <tr key={item.id}>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-800">{item.uniformType}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-700">{item.size}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-slate-900">{item.quantity}</td>
                            <td className="px-3 py-2 text-slate-600">{item.remarks || "—"}</td>
                          </tr>
                        ))}
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
                  {["REQUEST", "DISPATCHED", "IN_TRANSIT", "ARRIVED", "COLLECTED", "COMPLETED"].map((s, idx, arr) => {
                    const statusOrder = ["REQUEST", "DISPATCHED", "IN_TRANSIT", "ARRIVED", "COLLECTED", "COMPLETED"];
                    const currentIdx = statusOrder.indexOf(detail.status);
                    const thisIdx = statusOrder.indexOf(s);
                    const isDone = thisIdx <= currentIdx && detail.status !== "CANCELLED";
                    const isCurrent = s === detail.status;

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
                            {isDone && !isCurrent ? (
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

            {actions.length === 0 ? (
              <p className="text-sm text-slate-500">
                {detail.status === "CANCELLED"
                  ? "This request is archived and can no longer be updated."
                  : "No further actions available."}
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-slate-500">Actions:</span>
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
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
