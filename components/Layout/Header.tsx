"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

/**
 * Header component - Displays the navigation bar.
 * Shows basic auth navigation links.
 */
export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/session/current", { credentials: "include" });
      if (!res.ok) {
        setIsLoggedIn(false);
        return;
      }
      const body = (await res.json()) as { authenticated: boolean };
      setIsLoggedIn(Boolean(body.authenticated));
    };

    checkSession();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/session/logout", { method: "POST", credentials: "include" });
    setIsLoggedIn(false);
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="relative z-10 bg-white text-black shadow">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6">
        <Link href="/" className="flex items-center">
          <Image src="/d1storelogo.jpg" width={160} height={52} alt="RMIT Logo" />
        </Link>

        <div className="flex items-center gap-x-12">
          {isLoggedIn ? (
            <>
              <Link href="/dashboard" className="text-[15px] font-medium text-slate-900 hover:text-blue-700">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="text-[15px] font-medium text-slate-900 hover:text-red-600">
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[15px] font-medium text-slate-900 hover:text-blue-700">
                Log in
              </Link>
              <Link href="/register" className="text-[15px] font-medium text-slate-900 hover:text-blue-700">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

