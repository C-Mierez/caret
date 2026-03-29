import "server-only";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { URLs } from "./urls";

type Props = {
	redirectTo?: string;
};

/**
 * Enforces authenticated access and returns a Convex Auth token for server-side calls.
 * Redirects when either the user session or token is missing.
 *
 * Meant to be used in server components that call protected Convex functions inside protected routes.
 * Implemented this as an additional safe-guard in case Proxy.ts is bypassed or misconfigured.
 */
export async function getOrRedirectConvexToken({
	redirectTo = URLs.signIn,
}: Props = {}) {
	const { userId, getToken } = await auth();

	if (!userId) redirect(redirectTo);

	const token = await getToken({ template: "convex" });

	if (!token) redirect(redirectTo);

	return token;
}
