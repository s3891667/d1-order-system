"use client";
import { useEffect } from "react";
import LoginForm from "@/components/Login/LoginForm";
import { useRouter } from "next/navigation";
import { User } from "../../types/user";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();

    useEffect(() => {
        const userInfo: User | null = JSON.parse(localStorage.getItem("user") || "null");

        if (userInfo && userInfo.id && userInfo.role) {
            if (userInfo.role === "staff") {
                router.replace("/staff");
            } else if (userInfo.role === "manager") {
                router.replace("/dashboard");
            } else {
                router.replace("/");
            }
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                {/* Sign In Title */}
                <div className="text-center mb-6">
                    <div className="text-3xl">👤</div>
                    <h2 className="text-2xl font-bold text-black">Sign In</h2>
                </div>

                {/* Login Form */}
                <LoginForm />

                {/* Footer */}
                <div className="flex justify-center text-sm mt-4 text-black">
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

