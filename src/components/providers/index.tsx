import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import type React from "react";
import ConvexClientProvider from "./convex-client-provider";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem
			disableTransitionOnChange
		>
			<ClerkProvider
				appearance={{
					theme: shadcn,
				}}
			>
				{/* Convex must be nested inside ClerkProvider */}
				<ConvexClientProvider>{children}</ConvexClientProvider>
			</ClerkProvider>
		</ThemeProvider>
	);
}
