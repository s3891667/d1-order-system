"use client";

import type { UniformRequestRecord } from "./types";
import { formatStatus, getStatusBadgeClass } from "./utils";

type Props = {
  requests: UniformRequestRecord[];
  onRowClick: (id: number) => void;
};

export default function RequestStatusTable({ requests, onRowClick }: Props) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">EAN</th>
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
            <tr
              key={request.id}
              onClick={() => onRowClick(request.id)}
              className="cursor-pointer transition hover:bg-indigo-50/60"
            >
              <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                <span className="flex items-center gap-1.5">
                  {request.ean}
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
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(request.status)}`}>
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
  );
}
