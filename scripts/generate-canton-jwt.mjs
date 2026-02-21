#!/usr/bin/env node
// scripts/generate-canton-jwt.mjs
//
// Generate a DAML-compatible JWT for Canton Ledger API authentication.
// This is for LOCAL DEVELOPMENT ONLY — production uses DA Hub OAuth2.
//
// Usage:
//   node scripts/generate-canton-jwt.mjs [partyId] [ledgerId]
//
// Example:
//   node scripts/generate-canton-jwt.mjs "moneyMoveUser::1234" "canton-sandbox"
//
// The generated JWT is valid for 1 year and can be used in:
//   - .env.local → CANTON_JWT=<generated-jwt>
//   - Authorization: Bearer <generated-jwt> header
//   - Canton wallet modal → paste JWT

import crypto from "crypto";

const partyId = process.argv[2] || "money-move-app::1220localdev";
const ledgerId = process.argv[3] || "canton-sandbox";
const applicationId = "money-move-2026";

// JWT secret for local/sandbox Canton (not used in production)
const JWT_SECRET = process.env.CANTON_JWT_SECRET || "canton-local-dev-secret";

const now = Math.floor(Date.now() / 1000);
const oneYear = 365 * 24 * 60 * 60;

const header = {
    alg: "HS256",
    typ: "JWT",
};

const payload = {
    aud: "https://daml.com/ledger-api",
    sub: partyId,
    iss: "money-move-2026-local",
    iat: now,
    exp: now + oneYear,
    "https://daml.com/ledger-api": {
        ledgerId,
        applicationId,
        readAs: [partyId],
        actAs: [partyId],
    },
};

function base64url(obj) {
    return Buffer.from(JSON.stringify(obj))
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

const headerB64 = base64url(header);
const payloadB64 = base64url(payload);
const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const jwt = `${headerB64}.${payloadB64}.${signature}`;

console.log("");
console.log("═══════════════════════════════════════════════════════════════");
console.log("  Canton JWT Generator — Local Development");
console.log("═══════════════════════════════════════════════════════════════");
console.log("");
console.log("  Party ID:       ", partyId);
console.log("  Ledger ID:      ", ledgerId);
console.log("  Application ID: ", applicationId);
console.log("  Expires:        ", new Date((now + oneYear) * 1000).toISOString());
console.log("");
console.log("  JWT:");
console.log("");
console.log(jwt);
console.log("");
console.log("  Add to .env.local:");
console.log(`  CANTON_JWT=${jwt}`);
console.log("");
console.log("  Or paste into the Canton wallet modal on the app.");
console.log("═══════════════════════════════════════════════════════════════");
console.log("");
