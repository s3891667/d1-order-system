"use client";
import { ReactNode } from "react";
import dynamic from "next/dynamic";
import Header from "./Header"
import Footer from "./Footer"

// Define the type for props that this component expects
interface LayoutProps {
	children: ReactNode; // Any valid React content (components, HTML, etc.)
}

/**
 * Layout Component
 * Wraps all pages in a consistent layout with Header and Footer.
 * Accepts `children` as the main content between the header and footer.
 */
const Layout = ({ children }: LayoutProps) => {
	return (
		// Container to center the page content and apply maximum width
		<div className="mx-auto max-w-screen-3xl">
			{/* Reusable header component (top navigation bar) */}
			<Header />
			{/* Main content from the child component/page */}
			{children}
			{/* Reusable footer component */}
			<Footer />
		</div>
	);
};

export default Layout;

