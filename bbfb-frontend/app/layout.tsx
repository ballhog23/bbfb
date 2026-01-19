import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "BBFB",
	description: "BBFB fantasy football",
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
	return (
		<html lang="en-US">
			<body>
				{children}
			</body>
		</html>
	);
}
