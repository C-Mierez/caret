import "server-only";

import { importJWK, SignJWT } from "jose";
import { env } from "@/env";

const algorithm = "ES256";
const ttl = 3600; // Standard amount of seconds

async function getSigningKey() {
	let jwk: Record<string, unknown>;

	try {
		jwk = JSON.parse(env.CONVEX_SERVICE_TOKEN_SIGNING_JWK) as Record<
			string,
			unknown
		>;
	} catch {
		throw new Error(
			"CONVEX_SERVICE_TOKEN_SIGNING_JWK must be a private JWK JSON string",
		);
	}

	return await importJWK(jwk, algorithm);
}

export async function mintServiceToken(subject: string): Promise<string> {
	const key = await getSigningKey();

	const kid = env.CONVEX_SERVICE_TOKEN_KID;
	if (!kid) {
		throw new Error(
			"Missing CONVEX_SERVICE_TOKEN_KID environment variable",
		);
	}

	return await new SignJWT({})
		.setProtectedHeader({ alg: algorithm, typ: "JWT", kid })
		.setIssuer(env.CONVEX_SERVICE_TOKEN_ISSUER)
		.setAudience(env.CONVEX_SERVICE_TOKEN_AUDIENCE)
		.setSubject(subject)
		.setExpirationTime(`${ttl}s`)
		.sign(key);
}
