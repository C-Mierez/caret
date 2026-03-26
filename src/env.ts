import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	server: {
		CLERK_SECRET_KEY: z.string(),
		CONVEX_DEPLOYMENT: z.string(),
		CLERK_JWT_ISSUER_DOMAIN: z.url(),
		GEMINI_API_KEY: z.string(),
	},
	client: {
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
		NEXT_PUBLIC_CONVEX_URL: z.url(),
		NEXT_PUBLIC_CONVEX_SITE_URL: z.url(),
	},
	runtimeEnv: {
		CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
		CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT,
		CLERK_JWT_ISSUER_DOMAIN: process.env.CLERK_JWT_ISSUER_DOMAIN,
		GEMINI_API_KEY: process.env.GEMINI_API_KEY,
		NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
			process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
		NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
		NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
	},
});
