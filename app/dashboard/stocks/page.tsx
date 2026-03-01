"use client";

import { useCallback, useEffect, useState } from "react";
import { LOW_STOCK_THRESHOLD } from "@/utils/uniformRequestPolicy";

type StockItem = {
  ean: string;
  name: string;
  qty: number;
};

export default function StocksPage() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<StockItem | null>(null);

  const loadStock = useCallback(async () => {
    try {
      const res = await fetch("/api/uniform/stocks");
      if (!res.ok) throw new Error("Failed to load stock");
      const data = (await res.json()) as StockItem[];
      setItems(data);
    } catch (err) {
      setError((err as Error).message ?? "Failed to load stock");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRemoveClick = (item: StockItem) => {
    setRemoveError(null);
    setPendingRemove(item);
  };

  const handleRemoveConfirm = async () => {
    if (!pendingRemove) return;
    const item = pendingRemove;
    const key = `${item.ean}-${item.name}`;
    setRemoving(key);
    setPendingRemove(null);
    try {
      const res = await fetch("/api/uniform/stocks/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ean: item.ean, name: item.name }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to remove");
      }
      setItems((prev) => prev.filter((i) => i.ean !== item.ean || i.name !== item.name));
    } catch (err) {
      setRemoveError((err as Error).message ?? "Failed to remove");
    } finally {
      setRemoving(null);
    }
  };

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingRemove(null);
    };
    if (pendingRemove) {
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }
  }, [pendingRemove]);

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.ean.includes(search)
  );

  const lowStockCount = items.filter((i) => i.qty <= LOW_STOCK_THRESHOLD).length;

  if (loading) {
    return (
      <section className="w-full max-w-6xl rounded-lg border bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Stock Inventory</h2>
          <p className="mt-1 text-sm text-slate-500">Loading...</p>
        </header>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-6xl rounded-lg border bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Stock Inventory</h2>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </header>
      </section>
    );
  }

  return (
    <section className="w-full max-w-6xl rounded-lg border bg-white p-6 shadow-sm">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Stock Inventory</h2>
          <p className="mt-1 text-sm text-slate-500">
            View and monitor uniform stock levels across all items.
          </p>
        </div>
        {lowStockCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
            {lowStockCount} item{lowStockCount !== 1 ? "s" : ""} low on stock
          </span>
        )}
      </header>

      {removeError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {removeError}
        </div>
      )}

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name or EAN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-xs"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-900">EAN</th>
              <th className="px-4 py-3 font-semibold text-slate-900">Name</th>
              <th className="px-4 py-3 font-semibold text-slate-900 text-right">Quantity</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  {search ? "No items match your search." : "No stock items yet."}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => (
                <tr
                  key={`${item.ean}-${item.name}`}
                  className={
                    item.qty <= LOW_STOCK_THRESHOLD
                      ? "bg-amber-50/50"
                      : undefined
                  }
                >
                  <td className="px-4 py-3 font-mono text-slate-700">{item.ean}</td>
                  <td className="px-4 py-3 text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={
                        item.qty <= LOW_STOCK_THRESHOLD
                          ? "font-semibold text-amber-700"
                          : "text-slate-700"
                      }
                    >
                      {item.qty}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveClick(item)}
                      disabled={removing === `${item.ean}-${item.name}`}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      {removing === `${item.ean}-${item.name}` ? "Removing..." : "Remove"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Showing {filteredItems.length} of {items.length} items
          {search && " (filtered)"}
        </p>
      )}

      {pendingRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-modal-title"
          onClick={() => setPendingRemove(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="remove-modal-title" className="text-lg font-semibold text-slate-900">
              Remove stock item
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to remove{" "}
              <span className="font-medium text-slate-900">&quot;{pendingRemove.name}&quot;</span>{" "}
              (EAN: <span className="font-mono text-slate-700">{pendingRemove.ean}</span>) from the inventory?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingRemove(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
