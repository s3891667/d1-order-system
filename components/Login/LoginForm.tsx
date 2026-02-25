"use client";
import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
	//const recaptchaRef = useRef<ReCAPTCHA>(null);
	const [isVerified, setIsVerified] = useState(false);
	const [role, setRole] = useState<"manager" | "staff">("manager");
	const router = useRouter();
	const [loginSuccess, setLoginSuccess] = useState(false);

	// Handle reCAPTCHA
	const handleCaptchaSubmission = async (token: string | null) => {
		if (token) {
			setIsVerified(true); // Trust that reCAPTCHA worked on client
		} else {
			setIsVerified(false);
		}
		try {
			if (token) {
				await fetch("/api", {
					method: "POST",
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ token }),
				});
				setIsVerified(true);
			}
		} catch {
			setIsVerified(false);
		}
	};

	const handleChange = (token: string | null) => {
		handleCaptchaSubmission(token);
	};

	const handleExpired = () => {
		setIsVerified(false);
	};

	//  Async function to handle login
	const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!isVerified) return;

		const form = e.currentTarget;
		const emailOrUsername = (form.elements.namedItem("emailOrUsername") as HTMLInputElement).value;
		const password = (form.elements.namedItem("password") as HTMLInputElement).value;

		try {
			console.log("Trying to login with:", { emailOrUsername, password, role });

			const res = await fetch("http://localhost:5000/api/users/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: emailOrUsername, password, role }),
			});

			if (!res.ok) {
				throw new Error("Invalid credentials");
			}

			const user = await res.json();

			// Set user state or context
			localStorage.setItem("user", JSON.stringify(user));

			// ✅ Navigate
			router.push(role === "manager" ? "/manager" : "/");
		} catch (error) {
			setLoginSuccess(false);
			alert("❌ Login failed: " + (error as Error).message);
		}
	};
	

	return (
		<form onSubmit={handleLogin}>
			{/* Role Toggle */}
			<div className="flex justify-center mb-4 space-x-4 text-black">
				<button
					type="button"
					className={`px-4 py-2 rounded ${role === "manager" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
						}`}
					onClick={() => setRole("manager")}
				>
					Manager
				</button>
				<button
					type="button"
					className={`px-4 py-2 rounded ${role === "staff" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
						}`}
					onClick={() => setRole("staff")}
				>
					Staff
				</button>
			</div>

			<div className="mb-4">
				<label htmlFor="emailOrUsername" className="block mb-1 text-sm font-medium text-black">
					Email 
				</label>
				<input
					id="emailOrUsername"
					name="emailOrUsername"
					type="text"
					placeholder="Enter your email "
					required
					className="text-black w-full border rounded p-2"
				/>
			</div>

			<div className="mb-4">
				<label htmlFor="password" className="block mb-1 text-sm font-medium text-black">
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
                    placeholder="enter your password"
					required
					className="text-black w-full border rounded p-2"
				/>
			</div>


			<button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
				Sign In
			</button>

			{loginSuccess && (
				<p className="text-green-600 text-center mt-4">Login Successful!</p>
			)}
		</form>
	);
}
