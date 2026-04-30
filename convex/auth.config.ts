import type { AuthConfig } from "convex/server";

const clerkIssuer = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!clerkIssuer) {
	throw new Error("Missing CLERK_JWT_ISSUER_DOMAIN");
}

const machineTokenIssuer = process.env.CONVEX_SERVICE_TOKEN_ISSUER;
const machineTokenAudience = process.env.CONVEX_SERVICE_TOKEN_AUDIENCE;
const machineTokenJwkRaw = process.env.CONVEX_SERVICE_TOKEN_PUBLIC_JWK;

if (!machineTokenIssuer || !machineTokenAudience || !machineTokenJwkRaw) {
	throw new Error(
		"Missing machine token environment variables: CONVEX_SERVICE_TOKEN_ISSUER, CONVEX_SERVICE_TOKEN_AUDIENCE, or CONVEX_SERVICE_TOKEN_PUBLIC_JWK",
	);
}

let machineTokenJwk: unknown;
try {
	machineTokenJwk = JSON.parse(machineTokenJwkRaw);
} catch {
	throw new Error(
		"CONVEX_SERVICE_TOKEN_PUBLIC_JWK must be valid JSON (a single JWK object)",
	);
}

export default {
	providers: [
		{
			domain: clerkIssuer,
			applicationID: "convex",
		},
		{
			type: "customJwt",
			issuer: machineTokenIssuer,
			applicationID: machineTokenAudience,
			algorithm: "ES256",
			jwks: `data:application/json;charset=utf-8,${encodeURIComponent(
				JSON.stringify({
					keys: [machineTokenJwk],
				}),
			)}`,
		},
	],
} satisfies AuthConfig;
