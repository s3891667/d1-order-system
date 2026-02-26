"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

type AppRole = "admin" | "dispatchAdmin";

export default function LoginForm() {
  const [role, setRole] = useState<AppRole>("admin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Invalid credentials");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <div className="mb-4 flex justify-center space-x-4 text-black">
        <button
          type="button"
          className={`rounded px-4 py-2 ${role === "admin" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
          onClick={() => setRole("admin")}
        >
          Admin
        </button>
        <button
          type="button"
          className={`rounded px-4 py-2 ${role === "dispatchAdmin" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"}`}
          onClick={() => setRole("dispatchAdmin")}
        >
          Dispatch Admin
        </button>
      </div>

      <div className="mb-4">
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-black">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Enter your email"
          required
          className="w-full rounded border p-2 text-black"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-black">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          required
          className="w-full rounded border p-2 text-black"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "Signing in..." : "Sign In"}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}
    </form>
  );
}
