// src/app/api/canton/register/route.ts
//
// Self-service Canton onboarding via the public Validator wallet API.
//
// The Canton Network's validator nodes expose a public /v0/register endpoint
// that allows users to create their own wallet without operator intervention.
//
// This proxies that request server-side so we can add error handling,
// rate limiting, and logging without exposing the validator URL to the browser.
//
// POST /api/canton/register
//   Body: { partyHint?: string, userId?: string }
//   → Creates a new Canton wallet user and returns their party ID
//
// Validator node URL: set CANTON_VALIDATOR_URL in .env.local
// (defaults to the public cantonnodes.com validator proxy)

import { NextRequest, NextResponse } from "next/server";

const VALIDATOR_URL = (
    process.env.CANTON_VALIDATOR_URL || ""
).replace(/\/$/, "");

export async function POST(request: NextRequest) {
    // Guard: needs a real Canton validator node with /v0/register support
    if (!VALIDATOR_URL) {
        return NextResponse.json({
            success: false,
            configured: false,
            error: "CANTON_VALIDATOR_URL not configured.",
            hint: "Self-registration requires a DAML Hub account (https://hub.daml.com) or a self-hosted Canton validator node. Set CANTON_VALIDATOR_URL in .env.local.",
        }, { status: 503 });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const { partyHint, userId } = body;

        // Canton validator self-registration
        // POST /v0/register → creates a hosted party on the validator node
        const registerBody: Record<string, string> = {};
        if (partyHint) registerBody.partyHint = partyHint;
        if (userId) registerBody.userId = userId;

        const res = await fetch(`${VALIDATOR_URL}/v0/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // No auth needed for self-registration on public validators
            },
            body: Object.keys(registerBody).length > 0
                ? JSON.stringify(registerBody)
                : undefined,
        });

        const responseText = await res.text();
        let responseJson: unknown;
        try {
            responseJson = JSON.parse(responseText);
        } catch {
            responseJson = { raw: responseText };
        }

        if (!res.ok) {
            console.error("[/api/canton/register]", res.status, responseText);
            return NextResponse.json({
                success: false,
                error: `Validator registration failed: ${res.status}`,
                details: responseJson,
                hint: "The public validator at cantonnodes.com may require a dedicated node for registration. Contact your Canton node operator.",
            }, { status: res.status });
        }

        // Successful registration returns party ID + user token
        return NextResponse.json({
            success: true,
            data: responseJson,
            message: "Canton wallet created. Save your party ID — you'll need it for bridge operations.",
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[/api/canton/register]", message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

// GET /api/canton/register?userId=X → check if user exists
export async function GET(request: NextRequest) {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
        return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    try {
        const res = await fetch(`${VALIDATOR_URL}/v0/user?userId=${encodeURIComponent(userId)}`, {
            headers: { "Accept": "application/json" },
        });

        if (res.status === 404) {
            return NextResponse.json({ success: false, exists: false, error: "User not found" }, { status: 404 });
        }

        const data = await res.json();
        return NextResponse.json({ success: true, exists: true, data });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
