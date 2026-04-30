import "server-only";

import { ConvexHttpClient } from "convex/browser";
import { env } from "@/env";

// This convex client is meant to be used for server-side operations inside in a server component or action that can be associated with a user session.
export const convexClient = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);

// For background jobs, a machine client should be used
export async function getMachineConvexClient(serviceToken: string) {
	const client = new ConvexHttpClient(env.NEXT_PUBLIC_CONVEX_URL);

	client.setAuth(serviceToken);

	return client;
}
