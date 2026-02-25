"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

/**
 * Header component - Displays the navigation bar.
 * Includes a hamburger menu (always visible) with Jobs/Profile links.
 */
export default function Header() {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [user, setUser] = useState<{ role?: string } | null>(null);
	const [menuOpen, setMenuOpen] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const checkLogin = () => {
			const data = localStorage.getItem("user");
			if (data) {
				setUser(JSON.parse(data));
				setIsLoggedIn(true);
			} else {
				setUser(null);
				setIsLoggedIn(false);
			}
		};
		checkLogin();
		//router.events?.on("routeChangeComplete", checkLogin);
		//return () => router.events?.off("routeChangeComplete", checkLogin);
	}, [router]);

	const handleLogout = () => {
		localStorage.removeItem("user");
		setIsLoggedIn(false);
		setUser(null);
		router.push("/");
	};

	const goTo = (path: string) => {
		setMenuOpen(false);
		router.push(path);
	};

	return (
		<header className="bg-white text-black relative z-10 shadow">
			<nav className="mx-auto flex max-w-7xl items-center justify-between p-6">
				{/* Hamburger: always visible */}
				{isLoggedIn && (
					<button
					onClick={() => setMenuOpen(o => !o)}
					aria-label="Toggle menu"
					className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl p-2"
					>
					&#9776;
					</button>
				)}

				{/* Logo */}
				<a href="/" className="flex items-center">
					<Image
						src="/d1storelogo.jpg"
						width={100}
						height={32}
						alt="RMIT Logo"
					/>
				</a>

				{/* Desktop links */}
				<div className="flex items-center gap-x-12">
					{user?.role === "lecturer" && (
						<a
							href="/lecturers"
							className="font-medium hover:text-blue-700 text-slate-900 text-[15px]"
						>
							Lecturers
						</a>
					)}
					{/*{user?.role === "tutor" && (
						<a
							href="/tutors"
							className="font-medium hover:text-blue-700 text-slate-900 text-[15px]"
						>
							Tutors
						</a>
					)}*/}
				</div>

				{/* Auth actions */}
				<div className="flex items-center gap-x-12">
					{isLoggedIn ? (
						<button
							onClick={handleLogout}
							className="font-medium hover:text-red-600 text-slate-900 text-[15px]"
						>
							Log out
						</button>
					) : (
						<>
							<a
								href="/login"
								className="font-medium hover:text-blue-700 text-slate-900 text-[15px]"
							>
								Log in
							</a>
							<a
								href="/register"
								className="font-medium hover:text-blue-700 text-slate-900 text-[15px]"
							>
								Register
							</a>
						</>
					)}
				</div>
			</nav>

			{/* Overlay menu */}
			{menuOpen && (
				<>
					{/* Overlay to darken background */}
					<div
						className="fixed inset-0 bg-transparent bg-opacity-30 z-30"
						onClick={() => setMenuOpen(false)}
					></div>

					{/* Sidebar menu */}
					<div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transition-transform transform translate-x-0">
						{/* Close button */}
						<div className="flex justify-end p-4 border-b">
							<button
								onClick={() => setMenuOpen(false)}
								className="text-2xl text-gray-700 hover:text-red-600"
								aria-label="Close menu"
							>
								&times;
							</button>
						</div>

						{/* Navigation links */}
						<nav className="flex flex-col px-6 py-4 space-y-4">
							<button
								onClick={() => goTo("/tutors")}
								className="text-left hover:underline"
							>
								Jobs
							</button>
							<button
								onClick={() => goTo("/profile")}
								className="text-left hover:underline"
							>
								Profile
							</button>
						</nav>
					</div>
				</>
			)}
		</header>
	);
}

