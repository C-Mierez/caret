"use client";

import { UserButton, useAuth } from "@clerk/nextjs";

// Made this small wrapper to prevent hydration errors
export default function ClerkUserButton() {
	const { isLoaded } = useAuth();

	if (!isLoaded) {
		return null;
	}

	return <UserButton />;
}
