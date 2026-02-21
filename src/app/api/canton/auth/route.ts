// src/app/api/canton/auth/route.ts
//
// DA Hub OIDC callback handler + JWT utilities.
//
// Two flows:
//
// 1. DA Hub OIDC (primary):
//    GET /api/canton/auth?code=<code>&state=<state>
//    → exchanges authorization code for JWT via DA Hub token endpoint
//    → redirects to /?canton_jwt=<jwt>&canton_party=<party>
//    → frontend stores JWT in localStorage
//
// 2. JWT validation (utility):
//    GET /api/canton/auth?action=validate&jwt=<jwt>
//    → decodes the JWT payload (no signature check — server verifies via ledger)
//    → returns { partyId, exp, ledgerId, applicationId }
//
// DA Hub setup:
//   - Register redirect URI at hub.daml.com → Project Settings → OAuth2
//   - Local dev: http://localhost:3001/api/canton/auth
//   - Production: https://yourdomain.com/api/canton/auth

import { NextRequest, NextResponse } from "next/server";

const DAML_HUB_DOMAIN = process.env.DAML_HUB_DOMAIN || "https://auth.daml.app";
const DAML_HUB_CLIENT_ID = process.env.DAML_HUB_CLIENT_ID || "";
const DAML_HUB_CLIENT_SECRET = process.env.DAML_HUB_CLIENT_SECRET || "";

/** Decode JWT payload without signature verification (server already trusts ledger response) */
function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
    try {
        const parts = jwt.split(".");
        if (parts.length !== 3) return null;
        // Base64url decode
        const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
        return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
    } catch {
        return null;
    }
}

/** Extract Canton party ID from DAML JWT claims */
function extractPartyFromJwt(payload: Record<string, unknown>): string | null {
    // DAML Hub JWTs have party in "sub" or in the DAML-specific claims
    const damlClaims = payload["https://daml.com/ledger-api"] as Record<string, unknown> | undefined;
    if (damlClaims?.actAs && Array.isArray(damlClaims.actAs) && damlClaims.actAs[0]) {
        return String(damlClaims.actAs[0]);
    }
    if (typeof payload.sub === "string" && payload.sub.includes("::")) {
        return payload.sub;
    }
    return null;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    // ── JWT decode utility ──────────────────────────────────────────────────────
    if (action === "validate") {
        const jwt = searchParams.get("jwt");
        if (!jwt) {
            return NextResponse.json({ success: false, error: "jwt parameter required" }, { status: 400 });
        }
        const payload = decodeJwtPayload(jwt);
        if (!payload) {
            return NextResponse.json({ success: false, error: "Invalid JWT format" }, { status: 400 });
        }
        const partyId = extractPartyFromJwt(payload);
        const exp = typeof payload.exp === "number" ? payload.exp : null;
        const now = Math.floor(Date.now() / 1000);
        const damlClaims = payload["https://daml.com/ledger-api"] as Record<string, unknown> | undefined;

        return NextResponse.json({
            success: true,
            data: {
                partyId,
                exp,
                expired: exp ? exp < now : false,
                expiresIn: exp ? exp - now : null,
                ledgerId: damlClaims?.ledgerId || null,
                applicationId: damlClaims?.applicationId || null,
                subject: payload.sub || null,
            },
        });
    }

    // ── DA Hub OIDC callback ────────────────────────────────────────────────────
    if (code) {
        if (!DAML_HUB_CLIENT_ID || !DAML_HUB_CLIENT_SECRET) {
            // No DA Hub OIDC configured — redirect to app with error
            const url = new URL("/", request.url);
            url.searchParams.set("canton_error", "DA Hub OIDC not configured. Set DAML_HUB_CLIENT_ID and DAML_HUB_CLIENT_SECRET.");
            return NextResponse.redirect(url);
        }

        try {
            // Exchange authorization code for access token
            const tokenUrl = `${DAML_HUB_DOMAIN}/oauth2/token`;
            const redirectUri = new URL("/api/canton/auth", request.url).toString();

            const tokenResp = await fetch(tokenUrl, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code,
                    client_id: DAML_HUB_CLIENT_ID,
                    client_secret: DAML_HUB_CLIENT_SECRET,
                    redirect_uri: redirectUri,
                }),
            });

            if (!tokenResp.ok) {
                const errText = await tokenResp.text();
                console.error("[/api/canton/auth] Token exchange failed:", errText);
                const url = new URL("/", request.url);
                url.searchParams.set("canton_error", `DA Hub token exchange failed: ${tokenResp.status}`);
                return NextResponse.redirect(url);
            }

            const tokenData = await tokenResp.json() as { access_token?: string; id_token?: string };
            const jwt = tokenData.access_token || tokenData.id_token;
            if (!jwt) {
                const url = new URL("/", request.url);
                url.searchParams.set("canton_error", "DA Hub returned no access token");
                return NextResponse.redirect(url);
            }

            // Extract party from JWT
            const payload = decodeJwtPayload(jwt);
            const partyId = payload ? extractPartyFromJwt(payload) : null;

            // Redirect back to the app with JWT + party in URL fragment
            // Frontend reads these from the URL and stores in localStorage
            const returnUrl = new URL("/", request.url);
            returnUrl.searchParams.set("canton_jwt", jwt);
            if (partyId) returnUrl.searchParams.set("canton_party", partyId);
            if (state) returnUrl.searchParams.set("canton_state", state);

            return NextResponse.redirect(returnUrl);

        } catch (err) {
            console.error("[/api/canton/auth] Error:", err);
            const url = new URL("/", request.url);
            url.searchParams.set("canton_error", "Canton auth failed. Please try again.");
            return NextResponse.redirect(url);
        }
    }

    // ── Build DA Hub login URL ──────────────────────────────────────────────────
    if (action === "login" || action === "url") {
        if (!DAML_HUB_CLIENT_ID) {
            return NextResponse.json({
                success: false,
                error: "DAML_HUB_CLIENT_ID not configured",
                hint: "Get a DA Hub client ID at hub.daml.com → Project Settings → OAuth2",
            }, { status: 503 });
        }

        const redirectUri = new URL("/api/canton/auth", request.url).toString();
        const authUrl = new URL(`${DAML_HUB_DOMAIN}/oauth2/authorize`);
        authUrl.searchParams.set("client_id", DAML_HUB_CLIENT_ID);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "openid email offline_access");
        authUrl.searchParams.set("audience", "https://daml.com/ledger-api");
        const stateVal = Math.random().toString(36).slice(2);
        authUrl.searchParams.set("state", stateVal);

        if (action === "url") {
            return NextResponse.json({ success: true, url: authUrl.toString(), state: stateVal });
        }
        return NextResponse.redirect(authUrl.toString());
    }

    return NextResponse.json({
        success: false,
        error: "Invalid action. Use: ?action=validate&jwt=..., ?action=login, ?action=url, or ?code=...",
    }, { status: 400 });
}
