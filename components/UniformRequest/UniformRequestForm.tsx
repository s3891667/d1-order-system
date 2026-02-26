"use client"
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { StaffRole, StockItem } from "@/generated/prisma/browser";
import { LOW_STOCK_THRESHOLD } from "@/utils/uniformRequestPolicy";

type UniformRequestFormValues = {
  staffRole: StaffRole | "";
  staffMember: string;
  uniformLimit: number;
  uniformItem: string;
  quantity: number;
  notes: string;
};

type StaffOption = {
  id: number;
  displayName: string;
  role: StaffRole;
  uniformLimit: number | null;
};

type StockOption = Pick<StockItem, "ean" | "name" | "qty">;
type CooldownStatus = {
  canRequest: boolean;
  nextAllowedAt: string | null;
  uniformLimit: number | null;
};

function useOptionsLoader<T>(loader: () => Promise<T[]>, emptyMessage: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      const result = await loader();

      if (!isMounted) return;

      setData(result);
      setError(result.length === 0 ? emptyMessage : "");
      setLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [loader, emptyMessage]);

  return { data, loading, error };
}

const fetchStaff = async (): Promise<StaffOption[]> => {
  try {
    const res = await fetch("/api/staff-management/staffs");

    if (!res.ok) throw new Error("Failed to fetch staff");

    const result = (await res.json()) as StaffOption[];
    return result;
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
};

const fetchUniformStock = async (): Promise<StockOption[]> => {
  try {
    const res = await fetch("/api/uniform/stock");

    if (!res.ok) throw new Error("Failed to fetch uniform stock");

    const result = (await res.json()) as StockOption[];
    return result;
  } catch (error) {
    console.error("Error fetching uniform stock:", error);
    return [];
  }
};

const INITIAL_FORM_VALUES: UniformRequestFormValues = {
  staffRole: "",
  staffMember: "",
  uniformLimit: 1,
  uniformItem: "",
  quantity: 1,
  notes: "",
};

export default function UniformRequestForm() {
  const [formValues, setFormValues] = useState<UniformRequestFormValues>(INITIAL_FORM_VALUES);

  const {
    data: staffList,
    loading: isLoadingStaff,
    error: staffError,
  } = useOptionsLoader(fetchStaff, "No staff found.");

  const {
    data: uniformStock,
    loading: isLoadingStock,
    error: stockError,
  } = useOptionsLoader(fetchUniformStock, "No uniform stock found.");

  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [cooldownStatus, setCooldownStatus] = useState<CooldownStatus | null>(null);
  const [isCheckingCooldown, setIsCheckingCooldown] = useState(false);
  const [isRoleStepVisible, setIsRoleStepVisible] = useState(true);
  const [isRoleStepFading, setIsRoleStepFading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const filteredStaffOptions = useMemo(
    () => staffList.filter((staff) => staff.role === formValues.staffRole),
    [staffList, formValues.staffRole]
  );
  const selectedStockItem = useMemo(
    () => uniformStock.find((item) => item.ean === formValues.uniformItem),
    [uniformStock, formValues.uniformItem]
  );
  const isSelectedItemLowStock = Boolean(selectedStockItem && selectedStockItem.qty <= LOW_STOCK_THRESHOLD);
  const exceedsStock = Boolean(selectedStockItem && formValues.quantity > selectedStockItem.qty);
  const exceedsUniformLimit = formValues.quantity > formValues.uniformLimit;
  const hasCooldownBlock = cooldownStatus ? !cooldownStatus.canRequest : false;

  useEffect(() => {
    if (!formValues.staffMember) {
      setCooldownStatus(null);
      return;
    }

    const controller = new AbortController();
    setIsCheckingCooldown(true);

    const loadCooldownStatus = async () => {
      try {
        const res = await fetch(`/api/staff-management/staffs/${formValues.staffMember}/limit`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch cooldown status");
        const result = (await res.json()) as CooldownStatus;
        setCooldownStatus(result);
        setFormValues((prev) => ({
          ...prev,
          uniformLimit:
            typeof result.uniformLimit === "number" && result.uniformLimit > 0
              ? result.uniformLimit
              : prev.uniformLimit,
        }));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        setCooldownStatus(null);
      } finally {
        if (!controller.signal.aborted) setIsCheckingCooldown(false);
      }
    };

    loadCooldownStatus();

    return () => controller.abort();
  }, [formValues.staffMember]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitMessage("");
    setSubmitError("");

    if (hasCooldownBlock) {
      setSubmitError("This staff member is currently in cooldown and cannot request yet.");
      return;
    }

    if (!selectedStockItem) {
      setSubmitError("Please select a uniform item.");
      return;
    }

    if (selectedStockItem.qty <= 0) {
      setSubmitError("Selected item is out of stock.");
      return;
    }

    if (exceedsStock) {
      setSubmitError(`Requested quantity exceeds available stock (${selectedStockItem.qty}).`);
      return;
    }

    if (exceedsUniformLimit) {
      setSubmitError(`Requested quantity exceeds staff uniform limit (${formValues.uniformLimit}).`);
      return;
    }

    const limitRes = await fetch(`/api/staff-management/staffs/${formValues.staffMember}/limit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uniformLimit: formValues.uniformLimit }),
    });

    if (!limitRes.ok) {
      const errorBody = (await limitRes.json().catch(() => null)) as { error?: string } | null;
      setSubmitError(errorBody?.error ?? "Failed to save uniform limit.");
      return;
    }

    const res = await fetch(`/api/staff-management/staffs/${formValues.staffMember}/uniform-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues),
    });
    if (!res.ok) {
      const errorBody = (await res.json().catch(() => null)) as { error?: string } | null;
      setSubmitError(errorBody?.error ?? "Failed to submit uniform request.");
      return;
    }
    setSubmitMessage("Uniform request submitted.");
    setFormValues((prev) => ({
      ...prev,
      uniformItem: "",
      quantity: 1,
      notes: "",
    }));
  };

  const handleRoleChange = (selectedRole: string) => {
    setFormValues((prev) => ({
      ...prev,
      staffRole: selectedRole as StaffRole,
      staffMember: "",
      uniformLimit: 1,
    }));
  };

  const handleRoleStepNext = () => {
    if (!formValues.staffRole || !isRoleStepVisible) return;

    setIsRoleStepFading(true);

    window.setTimeout(() => {
      setIsRoleStepVisible(false);
      setIsRoleStepFading(false);
      setIsFormVisible(true);
    }, 300);
  };

  const handleChangeRole = () => {
    setFormValues((prev) => ({
      ...prev,
      staffRole: "",
      staffMember: "",
      uniformLimit: 1,
      uniformItem: "",
      quantity: 1,
      notes: "",
    }));
    setSubmitMessage("");
    setSubmitError("");
    setCooldownStatus(null);
    setIsFormVisible(false);
    setIsRoleStepVisible(true);
  };

  return (
    <section className="w-full max-w-3xl rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Create Uniform Request</h2>
      <p className="mt-2 text-sm text-slate-600">
        Select a staff member, choose a uniform item, set quantity, and submit.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {isRoleStepVisible && (
          <div
            className={`transition-opacity duration-300 ${isRoleStepFading ? "opacity-0" : "opacity-100"}`}
          >
            <label htmlFor="staffRole" className="mb-1 block text-sm font-medium text-slate-700">
              Staff Role
            </label>
            <select
              id="staffRole"
              value={formValues.staffRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select role</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
              <option value="CASUAL">Casual</option>
            </select>

            <div className="py-4">
              <label htmlFor="uniformLimit" className="mb-1 block text-sm font-medium text-slate-700">
                Uniform Limit
              </label>
              <input
                id="uniformLimit"
                type="number"
                min={1}
                value={formValues.uniformLimit}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    uniformLimit: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleRoleStepNext}
              disabled={!formValues.staffRole}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Next
            </button>
          </div>
        )}

        {!isRoleStepVisible && (
          <div className={`space-y-4 transition-opacity duration-500 ${isFormVisible ? "opacity-100" : "opacity-0"}`}>
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-sm text-slate-700">
                Selected role: <span className="font-medium">{formValues.staffRole}</span>
              </p>
              <button
                type="button"
                onClick={handleChangeRole}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Change role
              </button>
            </div>

            <div>
              <label htmlFor="staffMember" className="mb-1 block text-sm font-medium text-slate-700">
                Staff Member
              </label>
              <select
                id="staffMember"
                value={formValues.staffMember}
                onChange={(e) =>
                  setFormValues((prev) => {
                    const nextStaffId = e.target.value;
                    const nextStaff = staffList.find((staff) => String(staff.id) === nextStaffId);
                    return {
                      ...prev,
                      staffMember: nextStaffId,
                      uniformLimit:
                        nextStaff && typeof nextStaff.uniformLimit === "number"
                          ? Math.max(1, nextStaff.uniformLimit)
                          : prev.uniformLimit,
                    };
                  })
                }
                required
                disabled={!formValues.staffRole || isLoadingStaff}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">
                  {!formValues.staffRole
                    ? "Select role first"
                    : isLoadingStaff
                      ? "Loading staff..."
                      : filteredStaffOptions.length === 0
                        ? "No staff found for this role."
                      : "Select staff member"}
                </option>
                {filteredStaffOptions.map((staff) => (
                  <option key={staff.id} value={String(staff.id)}>
                    {staff.displayName}
                  </option>
                ))}
              </select>
              {staffError && <p className="mt-1 text-sm text-red-600">{staffError}</p>}
              {isCheckingCooldown && (
                <p className="mt-1 text-sm text-slate-500">Checking request cooldown...</p>
              )}
              {cooldownStatus && !cooldownStatus.canRequest && cooldownStatus.nextAllowedAt && (
                <p className="mt-1 text-sm text-amber-700">
                  This staff member request need to wait until{" "}
                  {new Date(cooldownStatus.nextAllowedAt).toLocaleString()}.
                </p>
              )}
              {formValues.staffMember && (
                <p className="mt-1 text-sm text-slate-500">
                  Staff uniform limit: {formValues.uniformLimit}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="uniformItem" className="mb-1 block text-sm font-medium text-slate-700">
                Uniform Item
              </label>
              <select
                id="uniformItem"
                value={formValues.uniformItem}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, uniformItem: e.target.value }))
                }
                required
                disabled={isLoadingStock}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">
                  {isLoadingStock
                    ? "Loading uniform stock..."
                    : uniformStock.length === 0
                      ? "No uniform stock available."
                      : "Select uniform item"}
                </option>
                {uniformStock.map((item) => (
                  <option key={item.ean} value={item.ean}>
                    {item.name} - {item.qty} in stock
                    {item.qty <= LOW_STOCK_THRESHOLD ? " (LOW STOCK)" : ""}
                  </option>
                ))}
              </select>
              {stockError && <p className="mt-1 text-sm text-red-600">{stockError}</p>}
              {selectedStockItem && selectedStockItem.qty <= 0 && (
                <p className="mt-1 text-sm text-red-600">This item is currently out of stock.</p>
              )}
              {selectedStockItem && isSelectedItemLowStock && selectedStockItem.qty > 0 && (
                <p className="mt-1 text-sm text-amber-700">
                  Low stock warning: only {selectedStockItem.qty} left.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-slate-700">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                max={selectedStockItem ? Math.max(Math.min(selectedStockItem.qty, formValues.uniformLimit), 1) : formValues.uniformLimit}
                value={formValues.quantity}
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    quantity: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {exceedsStock && selectedStockItem && (
                <p className="mt-1 text-sm text-red-600">
                  Quantity cannot exceed available stock ({selectedStockItem.qty}).
                </p>
              )}
              {exceedsUniformLimit && (
                <p className="mt-1 text-sm text-red-600">
                  Quantity cannot exceed staff uniform limit ({formValues.uniformLimit}).
                </p>
              )}
            </div>

            <div>
              <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                id="notes"
                value={formValues.notes}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                placeholder="Optional notes for this request"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={
                hasCooldownBlock ||
                isCheckingCooldown ||
                !selectedStockItem ||
                selectedStockItem.qty <= 0 ||
                exceedsStock ||
                exceedsUniformLimit
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Submit Request
            </button>

            {submitMessage && (
              <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {submitMessage}
              </p>
            )}
            {submitError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </p>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
