"use client";
import { useEffect } from "react";
import LoginForm from "@/components/Login/LoginForm";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/session/current", { credentials: "include" });
      if (res.ok) {
        router.replace("/dashboard");
      }
    };

    checkSession();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <div className="text-3xl">👤</div>
          <h2 className="text-2xl font-bold text-black">Sign In</h2>
        </div>

        <LoginForm />

        <div className="mt-4 flex justify-center text-sm text-black">
          <div>
            New User?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
