"use client";

import { useEffect, useState } from "react";

type UniformRequestRecord = {
  id: number;
  requestNo: string;
  trackingId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  requestedBy: number;
  staff: {
    displayName: string;
    role: string;
  } | null;
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "REQUEST":
    case "SUBMITTED":
      return "bg-blue-100 text-blue-700";
    case "DISPATCHED":
    case "IN_PROGRESS":
      return "bg-indigo-100 text-indigo-700";
    case "ARRIVED":
    case "READY_FOR_COLLECTION":
      return "bg-amber-100 text-amber-800";
    case "COLLECTED":
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "REJECTED":
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "APPROVED":
      return "bg-cyan-100 text-cyan-700";
    case "DRAFT":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function UniformRequestStatusView() {
  const [requests, setRequests] = useState<UniformRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      setIsLoading(true);
      setError("");

      try {
        const res = await fetch("/api/uniform/requests");
        if (!res.ok) {
          throw new Error("Failed to fetch request list.");
        }

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

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Track Request Status</h2>
      <p className="mt-2 text-sm text-slate-600">Simple view of all uniform requests and their current status.</p>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading requests...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!isLoading && !error && requests.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">No uniform requests found yet.</p>
      )}

      {!isLoading && !error && requests.length > 0 && (
        <div className="mt-4 overflow-x-auto">
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
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-800">{request.requestNo}</td>
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
    </section>
  );
}
