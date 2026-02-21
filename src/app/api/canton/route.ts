// src/app/api/canton/route.ts
//
// Server-side Canton ledger API proxy — PER-USER JWT FLOW
//
// Auth priority:
//   1. Authorization: Bearer <jwt> header from client (production per-user flow)
//   2. CANTON_JWT env var (operator/dev fallback — singleton)
//
// Actions:
//   GET  /api/canton?action=party                     → get party info
//   GET  /api/canton?action=bridge-agreement&party=X  → get BridgeUserAgreement CID
//   GET  /api/canton?action=holdings&party=X           → get USDCx holding CIDs
//   GET  /api/canton?action=attestation&msgHash=X      → poll Circle xReserve attestation
//   POST /api/canton { action: "mint", ... }           → BridgeUserAgreement_Mint
//   POST /api/canton { action: "burn", ... }           → BridgeUserAgreement_Burn

import { NextRequest, NextResponse } from "next/server";
import { CantonLedgerClient } from "@/lib/canton/cantonLedgerClient";
import { getAttestation } from "@/lib/adapters/canton/cantonBridgeAdapter";

/** Extract JWT for this request: header first, env var fallback */
function resolveJwt(request: NextRequest): string | null {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
        return authHeader.slice(7).trim();
    }
    return process.env.CANTON_JWT || null;
}

/** Build a per-request ledger client (not the singleton) */
function buildClient(jwt: string | null): CantonLedgerClient {
    return new CantonLedgerClient(
        process.env.CANTON_JSON_API_URL || "http://localhost:7575",
        jwt
    );
}

export async function GET(request: NextRequest) {
    // Guard: requires a real DAML HTTP JSON Ledger API
    if (!process.env.CANTON_JSON_API_URL) {
        return NextResponse.json({
            success: false,
            configured: false,
            error: "CANTON_JSON_API_URL not configured.",
            hint: "Canton bridge QUOTES work without this. For DAML ledger actions, set CANTON_JSON_API_URL to your DAML Hub URL or self-hosted node.",
        }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const party = searchParams.get("party") || "";
    const msgHash = searchParams.get("msgHash") || "";

    const jwt = resolveJwt(request);
    const client = buildClient(jwt);

    try {
        switch (action) {

            case "party": {
                if (!jwt) {
                    return NextResponse.json({
                        success: false,
                        error: "No Canton JWT provided. Log in via DA Hub or paste your JWT in the Canton wallet modal.",
                        authRequired: true,
                    }, { status: 401 });
                }
                const info = await client.getParty();
                return NextResponse.json({ success: true, data: info });
            }

            case "bridge-agreement": {
                if (!party) return NextResponse.json({ success: false, error: "party required" }, { status: 400 });
                if (!jwt) return NextResponse.json({ success: false, error: "No Canton JWT. Connect your Canton wallet first.", authRequired: true }, { status: 401 });
                const agreement = await client.getBridgeUserAgreement(party);
                if (!agreement) {
                    return NextResponse.json({
                        success: false,
                        error: "No BridgeUserAgreement found. User must be onboarded first.",
                        onboardingRequired: true,
                    }, { status: 404 });
                }
                return NextResponse.json({
                    success: true,
                    data: { contractId: agreement.contractId, payload: agreement.payload },
                });
            }

            case "holdings": {
                if (!party) return NextResponse.json({ success: false, error: "party required" }, { status: 400 });
                if (!jwt) return NextResponse.json({ success: false, error: "No Canton JWT. Connect your Canton wallet first.", authRequired: true }, { status: 401 });
                const holdings = await client.getUSDCxHoldings(party);
                return NextResponse.json({
                    success: true,
                    data: holdings.map((h) => ({
                        contractId: h.contractId,
                        amount: h.payload.amount?.value || "0",
                    })),
                });
            }

            case "attestation": {
                if (!msgHash) return NextResponse.json({ success: false, error: "msgHash required" }, { status: 400 });
                const attestation = await getAttestation(msgHash);
                return NextResponse.json({ success: true, data: attestation });
            }

            default:
                return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[/api/canton GET]", message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const jwt = resolveJwt(request);

    try {
        const body = await request.json();
        const { action } = body;

        const client = buildClient(jwt);

        switch (action) {

            case "mint": {
                if (!jwt) return NextResponse.json({ success: false, error: "No Canton JWT. Connect your Canton wallet first.", authRequired: true }, { status: 401 });
                const { bridgeAgreementCid, depositAttestationCid } = body;
                if (!bridgeAgreementCid || !depositAttestationCid) {
                    return NextResponse.json({ success: false, error: "bridgeAgreementCid and depositAttestationCid required" }, { status: 400 });
                }
                const result = await client.mintUSDCx({ bridgeAgreementCid, depositAttestationCid });
                return NextResponse.json({ success: true, data: result });
            }

            case "burn": {
                if (!jwt) return NextResponse.json({ success: false, error: "No Canton JWT. Connect your Canton wallet first.", authRequired: true }, { status: 401 });
                const { bridgeAgreementCid, holdingCids, amount, destinationEthAddress } = body;
                if (!bridgeAgreementCid || !holdingCids?.length || !amount || !destinationEthAddress) {
                    return NextResponse.json({ success: false, error: "bridgeAgreementCid, holdingCids, amount, destinationEthAddress required" }, { status: 400 });
                }
                const result = await client.burnUSDCx({ bridgeAgreementCid, holdingCids, amount, destinationEthAddress });
                return NextResponse.json({ success: true, data: result });
            }

            default:
                return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[/api/canton POST]", message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
