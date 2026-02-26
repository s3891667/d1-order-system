"use client";

import ImportPanel from "@/components/Import/ImportPanel";
import UniformRequestForm from "@/components/UniformRequest/UniformRequestForm";
import UniformRequestStatusView from "@/components/UniformRequest/UniformRequestStatusView";
import { useState } from "react";

type DashboardSection = "importData" | "createUniformRequest" | "trackRequestStatus";

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState<DashboardSection>("importData");

  const menuItemClass = (section: DashboardSection) =>
    `block w-full rounded-md px-3 py-2 text-left text-sm ${
      activeSection === section ? "bg-slate-100 font-medium text-slate-900" : "hover:bg-slate-100"
    }`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Toggle dashboard menu"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="rounded-md border border-slate-300 p-2 transition hover:bg-slate-100"
          >
            <span className="block h-0.5 w-5 bg-slate-800" />
            <span className="mt-1 block h-0.5 w-5 bg-slate-800" />
            <span className="mt-1 block h-0.5 w-5 bg-slate-800" />
          </button>
          <h1 className="text-lg font-semibold">Manager Dashboard</h1>
        </div>
        <span className="text-sm text-slate-500">Welcome, Manager</span>
      </header>

      <div className="flex min-h-[calc(100vh-57px)]">
        <aside
          className={`${
            isSidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0"
          } shrink-0 overflow-hidden border-t border-slate-300 bg-white shadow-md transition-all duration-300 ease-in-out`}
        >
          <div className="w-64 p-4">
            <nav className="space-y-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Menu
              </p>
              <button
                type="button"
                onClick={() => setActiveSection("importData")}
                className={menuItemClass("importData")}
              >
                Import Data
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("createUniformRequest")}
                className={menuItemClass("createUniformRequest")}
              >
                Create Uniform Request
              </button>
              <button
                type="button"
                onClick={() => setActiveSection("trackRequestStatus")}
                className={menuItemClass("trackRequestStatus")}
              >
                Track Request Status
              </button>
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">
          {activeSection === "importData" ? (
            <ImportPanel />
          ) : activeSection === "createUniformRequest" ? (
            <UniformRequestForm />
          ) : activeSection === "trackRequestStatus" ? (
            <UniformRequestStatusView />
          ) : null}
        </main>
      </div>
    </div>
  );
}

