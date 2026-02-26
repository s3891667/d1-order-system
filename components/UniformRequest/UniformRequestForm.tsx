"use client"
import { FormEvent, useState } from "react";

type UniformRequestFormValues = {
  staffMember: string;
  uniformItem: string;
  quantity: number;
};

const fetchStaff = async (data?: any) => {
  try {
    const res = await fetch("/api/staff-management/staffs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) throw new Error("Failed to fetch staff");

    const result = await res.json(); // this should be an array
    return result;
  } catch (error) {
    console.error("Error fetching staff:", error);
    return []; // return empty array on failure
  }
};

// --- Usage ---
const staffArray = await fetchStaff(); // MUST be inside async function or useEffect in client
const staffOptions = staffArray.map((staff) => ({
  value: staff.id,
  label: staff.displayName,
}));


const UNIFORM_ITEM_OPTIONS = [
  { value: "polo-shirt", label: "Polo Shirt" },
  { value: "trousers", label: "Trousers" },
  { value: "jacket", label: "Jacket" },
  { value: "name-badge", label: "Name Badge" },
];

const INITIAL_FORM_VALUES: UniformRequestFormValues = {
  staffMember: "",
  uniformItem: "",
  quantity: 1,
};

export default function UniformRequestForm() {
  const [formValues, setFormValues] = useState<UniformRequestFormValues>(INITIAL_FORM_VALUES);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setSubmitMessage("Uniform request submitted.");
    console.log("Uniform request payload:", formValues);
  };

  return (
    <section className="w-full max-w-3xl rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Create Uniform Request</h2>
      <p className="mt-2 text-sm text-slate-600">
        Select a staff member, choose a uniform item, set quantity, and submit.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="staffMember" className="mb-1 block text-sm font-medium text-slate-700">
            Staff Member
          </label>
          <select
            id="staffMember"
            value={formValues.staffMember}
            onChange={(e) =>
              setFormValues((prev) => ({ ...prev, staffMember: e.target.value }))
            }
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select staff member</option>
            {staffOptions.map((staff) => (
              <option key={staff.value} value={staff.value}>
                {staff.label}
              </option>
            ))}
          </select>
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
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select uniform item</option>
            {UNIFORM_ITEM_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="mb-1 block text-sm font-medium text-slate-700">
            Quantity
          </label>
          <input
            id="quantity"
            type="number"
            min={1}
            value={formValues.quantity}
            onChange={(e) =>
              setFormValues((prev) => ({
                ...prev,
                quantity: Number(e.target.value) || 1,
              }))
            }
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Submit Request
        </button>

        {submitMessage && (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {submitMessage}
          </p>
        )}
      </form>
    </section>
  );
}
