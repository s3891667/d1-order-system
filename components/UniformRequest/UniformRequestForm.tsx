"use client";
import { useEffect, useMemo, useState } from "react";
import type { FormEventHandler } from "react";
import type { StaffRole } from "@/generated/prisma/browser";
import { LOW_STOCK_THRESHOLD } from "@/utils/uniformRequestPolicy";
import type { CooldownStatus, UniformRequestFormValues } from "./types";
import { fetchStaff, fetchUniformStock, INITIAL_FORM_VALUES, useOptionsLoader } from "./utils";

type Props = {
  initialValues?: Partial<UniformRequestFormValues>;
};

export default function UniformRequestForm({ initialValues: initialValuesProp }: Props) {
  const hasInitialValues = Boolean(
    initialValuesProp && Object.keys(initialValuesProp).length > 0
  );
  const mergedInitial = useMemo(
    () =>
      hasInitialValues && initialValuesProp
        ? { ...INITIAL_FORM_VALUES, ...initialValuesProp }
        : INITIAL_FORM_VALUES,
    [hasInitialValues, initialValuesProp]
  );

  const [formValues, setFormValues] = useState<UniformRequestFormValues>(mergedInitial);
  const [quantityInput, setQuantityInput] = useState(String(mergedInitial.quantity));
  const [uniformLimitInput, setUniformLimitInput] = useState(String(mergedInitial.uniformLimit));
  const [hasAppliedInitial, setHasAppliedInitial] = useState(false);

  useEffect(() => {
    if (hasInitialValues && initialValuesProp && !hasAppliedInitial) {
      const merged = { ...INITIAL_FORM_VALUES, ...initialValuesProp };
      setFormValues(merged);
      setQuantityInput(String(merged.quantity));
      setUniformLimitInput(String(merged.uniformLimit));
      setIsRoleStepVisible(false);
      setIsFormVisible(true);
      setHasAppliedInitial(true);
    }
  }, [hasInitialValues, initialValuesProp, hasAppliedInitial]);

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
  const [totalOrdered, setTotalOrdered] = useState(0);
  const [isCheckingCooldown, setIsCheckingCooldown] = useState(false);
  const [isRoleStepVisible, setIsRoleStepVisible] = useState(
    !hasInitialValues || !(initialValuesProp?.staffRole && initialValuesProp?.staffMember)
  );
  const [isRoleStepFading, setIsRoleStepFading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(
    Boolean(hasInitialValues && initialValuesProp?.staffRole && initialValuesProp?.staffMember)
  );
  const [isEditingUniformLimit, setIsEditingUniformLimit] = useState(false);

  const filteredStaffOptions = useMemo(
    () => staffList.filter((staff) => staff.role === formValues.staffRole),
    [staffList, formValues.staffRole]
  );
  const selectedStockItem = useMemo(
    () => uniformStock.find((item) => item.ean === formValues.ean && item.name === formValues.name),
    [uniformStock, formValues.ean, formValues.name]
  );
  const effectiveRemaining = formValues.uniformLimit - totalOrdered;
  const maxQuantityFromStock = selectedStockItem ? Math.max(selectedStockItem.qty, 1) : 1;
  const isSelectedItemLowStock = Boolean(selectedStockItem && selectedStockItem.qty <= LOW_STOCK_THRESHOLD);
  const exceedsStock = Boolean(selectedStockItem && formValues.quantity > selectedStockItem.qty);
  const exceedsUniformLimit = formValues.quantity > effectiveRemaining;
  const isQuantityZero = quantityInput.trim() !== "" && Number(quantityInput) === 0;
  const hasCooldownBlock = cooldownStatus ? !cooldownStatus.canRequest : false;

  useEffect(() => {
    if (!formValues.staffMember) {
      setCooldownStatus(null);
      setTotalOrdered(0);
      setIsEditingUniformLimit(false);
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
        setTotalOrdered(result.totalOrdered ?? 0);
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
        setTotalOrdered(0);
      } finally {
        if (!controller.signal.aborted) setIsCheckingCooldown(false);
      }
    };

    loadCooldownStatus();

    return () => controller.abort();
  }, [formValues.staffMember]);

  useEffect(() => {
    setUniformLimitInput(String(formValues.uniformLimit));
  }, [formValues.uniformLimit]);

  useEffect(() => {
    if (formValues.quantity > maxQuantityFromStock) {
      const clamped = maxQuantityFromStock;
      setFormValues((prev) => ({ ...prev, quantity: clamped }));
      setQuantityInput(String(clamped));
    }
  }, [maxQuantityFromStock, formValues.quantity]);

  useEffect(() => {
    if (effectiveRemaining <= 0 && (formValues.ean || formValues.name)) {
      setFormValues((prev) => ({ ...prev, ean: "", name: "" }));
    }
  }, [effectiveRemaining, formValues.ean, formValues.name]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (e) => {
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
      setSubmitError(`Requested quantity exceeds remaining allowance (${effectiveRemaining} left of ${formValues.uniformLimit}).`);
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
      body: JSON.stringify({
        ...formValues,
        status: "REQUEST",
      }),
    });

    if (!res.ok) {
      const errorBody = (await res.json().catch(() => null)) as { error?: string } | null;
      setSubmitError(errorBody?.error ?? "Failed to submit uniform request.");
      return;
    }
    setSubmitMessage("Uniform request submitted.");
    setFormValues((prev) => ({
      ...prev,
      staffMember: "",
      ean: "",
      name: "",
      quantity: 1,
      notes: "",
    }));
    setQuantityInput("1");
  };

  const handleRoleChange = (selectedRole: string) => {
    setFormValues((prev) => ({
      ...prev,
      staffRole: selectedRole as StaffRole,
      staffMember: "",
      uniformLimit: 1,
    }));
    setIsEditingUniformLimit(false);
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
      ean: "",
      name: "",
      quantity: 1,
      notes: "",
    }));
    setQuantityInput(String(INITIAL_FORM_VALUES.quantity));
    setSubmitMessage("");
    setSubmitError("");
    setCooldownStatus(null);
    setTotalOrdered(0);
    setIsEditingUniformLimit(false);
    setIsFormVisible(false);
    setIsRoleStepVisible(true);
  };

  const handleQuantityInputBlur = () => {
    const parsedQuantity = Number(quantityInput);
    let nextQuantity =
      Number.isFinite(parsedQuantity) && parsedQuantity >= 1 ? Math.floor(parsedQuantity) : 1;
    nextQuantity = Math.min(nextQuantity, maxQuantityFromStock);

    setFormValues((prev) => ({ ...prev, quantity: nextQuantity }));
    setQuantityInput(String(nextQuantity));
  };

  return (
    <section className="w-full max-w-3xl rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Create Uniform Request</h2>
      <p className="mt-2 text-sm text-slate-600">
        Select role, then staff member and limit, choose a uniform item, set quantity, and submit.
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
                    setIsEditingUniformLimit(false);
                    setSubmitMessage("");
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
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between gap-3">
                <label htmlFor="uniformLimit" className="block text-sm font-medium text-slate-700">
                  Uniform Limit
                </label>
                <button
                  type="button"
                  onClick={() => setIsEditingUniformLimit((prev) => !prev)}
                  disabled={!formValues.staffMember}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {isEditingUniformLimit ? "Lock" : "Edit"}
                </button>
              </div>
              <input
                id="uniformLimit"
                type="number"
                min={1}
                value={uniformLimitInput}
                onChange={(e) => {
                  const next = e.target.value;
                  setUniformLimitInput(next);
                  const parsed = Number(next);
                  if (Number.isFinite(parsed) && parsed >= 1) {
                    setFormValues((prev) => ({ ...prev, uniformLimit: Math.floor(parsed) }));
                  }
                }}
                onBlur={() => {
                  const parsed = Number(uniformLimitInput);
                  const clamped = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
                  setFormValues((prev) => ({ ...prev, uniformLimit: clamped }));
                  setUniformLimitInput(String(clamped));
                }}
                required
                disabled={!formValues.staffMember || !isEditingUniformLimit}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              />
              {formValues.staffMember && (
                <div className="mt-2 flex items-center gap-2">
                  <p className="text-sm text-slate-500">
                    Click Edit to change staff limit order.
                  </p>
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      effectiveRemaining <= 0
                        ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {effectiveRemaining <= 0
                      ? "Cannot order more at this stage"
                      : `${effectiveRemaining} remaining of ${formValues.uniformLimit}`}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="uniformItem" className="mb-1 block text-sm font-medium text-slate-700">
                Uniform Item
              </label>
              <select
                id="uniformItem"
                value={formValues.ean && formValues.name ? `${formValues.ean}::${formValues.name}` : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setFormValues((prev) => ({ ...prev, ean: "", name: "" }));
                    return;
                  }
                  const sep = val.indexOf("::");
                  const selectedEan = sep >= 0 ? val.slice(0, sep) : val;
                  const selectedName = sep >= 0 ? val.slice(sep + 2) : "";
                  setFormValues((prev) => ({ ...prev, ean: selectedEan, name: selectedName }));
                }}
                required
                disabled={isLoadingStock || effectiveRemaining <= 0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">
                  {effectiveRemaining <= 0
                    ? "Cannot select - allowance used (0 remaining)"
                    : isLoadingStock
                      ? "Loading uniform stock..."
                      : uniformStock.length === 0
                        ? "No uniform stock available."
                        : "Select uniform item"}
                </option>
                {uniformStock.map((item) => (
                  <option key={`${item.ean}::${item.name}`} value={`${item.ean}::${item.name}`}>
                    {item.name} - {item.qty} in stock
                    {item.qty <= LOW_STOCK_THRESHOLD ? " (LOW STOCK)" : ""}
                  </option>
                ))}
              </select>
              {stockError && <p className="mt-1 text-sm text-red-600">{stockError}</p>}
              {effectiveRemaining <= 0 && (
                <p className="mt-1 text-sm text-amber-700">
                  Uniform item cannot be selected. Allowance used ({effectiveRemaining} remaining of {formValues.uniformLimit}).
                </p>
              )}
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
                max={maxQuantityFromStock}
                step={1}
                value={quantityInput}
                disabled={!selectedStockItem || selectedStockItem.qty <= 0}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setQuantityInput(nextValue);

                  const parsedQuantity = Number(nextValue);
                  if (Number.isFinite(parsedQuantity) && parsedQuantity >= 1) {
                    setFormValues((prev) => ({
                      ...prev,
                      quantity: Math.floor(parsedQuantity),
                    }));
                  }
                }}
                onBlur={handleQuantityInputBlur}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              />
              {isQuantityZero && (
                <p className="mt-1 text-sm text-red-600">Quantity cannot be 0. Please enter at least 1.</p>
              )}
              {exceedsUniformLimit && effectiveRemaining > 0 && (
                <p className="mt-1 text-sm text-amber-700">
                  Requested quantity exceeds remaining allowance. Only {effectiveRemaining} left of {formValues.uniformLimit}.
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
                isQuantityZero ||
                exceedsStock ||
                exceedsUniformLimit
              }
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
