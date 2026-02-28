"use client";

import UniformRequestStatusView from "@/components/UniformRequest/UniformRequestStatusView";
import { useReorderNavigation } from "@/hooks/useReorderNavigation";
import { useSessionRole } from "@/hooks/useSessionRole";

export default function TrackStatusPage() {
  const { isDispatchAdmin } = useSessionRole();
  const { navigateToReorder } = useReorderNavigation();

  return (
    <section className="space-y-6">
      <header className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Track Request Status</h2>
        <p className="mt-1 text-sm text-slate-500">
          View and manage all uniform requests and their current status.
        </p>
      </header>

      <UniformRequestStatusView
        isDispatchAdmin={isDispatchAdmin}
        onReorder={navigateToReorder}
        showHeader={false}
      />
    </section>
  );
}
