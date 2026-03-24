import "@/styles/globals.css";
import Providers from "@components/providers";
import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Caret",
	description: "Cursor-inspired text editor",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${geistSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
