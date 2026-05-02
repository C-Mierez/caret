const { generateKeyPairSync } = require("crypto");

const { privateKey, publicKey } = generateKeyPairSync("ec", {
	namedCurve: "prime256v1",
	format: "pem",
	publicKeyEncoding: { type: "spki", format: "pem" },
	privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

console.log("PRIVATE KEY (for .env):", privateKey);
console.log("PUBLIC KEY (for .env):", publicKey);

// Convert public key to JWK format
const { createPublicKey } = require("crypto");
const pubKey = createPublicKey(publicKey);
const jwk = pubKey.export({ format: "jwk" });
const { createPrivateKey } = require("crypto");
const privKey = createPrivateKey(privateKey);
const privateJwk = privKey.export({ format: "jwk" });

// Suggested kid to use for both signing and public JWK entries
const suggestedKid = "convex-internal-key-1";
privateJwk.kid = suggestedKid;
jwk.kid = suggestedKid;

console.log(
	"SUGGESTED KID:",
	suggestedKid,
	" - add as CONVEX_SERVICE_TOKEN_KID and include in both JWKs",
);
console.log(
	"PRIVATE JWK (for CONVEX_SERVICE_TOKEN_SIGNING_JWK):",
	JSON.stringify(privateJwk),
);
console.log(
	"PUBLIC JWK (for CONVEX_SERVICE_TOKEN_PUBLIC_JWK):",
	JSON.stringify(jwk),
);
