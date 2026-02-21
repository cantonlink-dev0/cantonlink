// src/app/api/canton/onboard/route.ts
//
// Server-side Canton onboarding route.
// Creates a BridgeUserAgreement for a new user on Canton.
//
// This exercises Canton_OnboardUser DAML choice using the utility operator's
// credentials (set in CANTON_UTILITY_OPERATOR_JWT server env var).
//
// POST /api/canton/onboard
//   Body: { partyId: string }
//   → Returns the new BridgeUserAgreementContractId

import { NextRequest, NextResponse } from "next/server";

// Separate high-privilege client for onboarding (uses operator JWT, not user JWT)
class CantonOperatorClient {
    private baseUrl: string;
    private jwt: string | null;

    constructor() {
        this.baseUrl = (process.env.CANTON_JSON_API_URL || "https://api.canton.network/json-api").replace(/\/$/, "");
        // This JWT must have utilityOperator party rights — never exposed to browser
        this.jwt = process.env.CANTON_UTILITY_OPERATOR_JWT || null;
    }

    private headers(): HeadersInit {
        const h: HeadersInit = { "Content-Type": "application/json" };
        if (this.jwt) h["Authorization"] = `Bearer ${this.jwt}`;
        return h;
    }

    async onboardUser(partyId: string): Promise<{ contractId: string } | null> {
        const templateId = `Digital-Asset-2:DA.Finance.Bridge.V2.BridgeUtility:BridgeUtility`;

        const body = {
            templateId,
            contractId: process.env.NEXT_PUBLIC_CANTON_APP_CONFIG_CONTRACT_ID,
            choice: "BridgeUtility_OnboardUser",
            argument: {
                user: partyId,
                bridgeOperator: process.env.NEXT_PUBLIC_CANTON_BRIDGE_OPERATOR,
                crossChainRepresentative: process.env.NEXT_PUBLIC_CANTON_CROSS_CHAIN_REP,
            },
        };

        const res = await fetch(`${this.baseUrl}/v1/exercise`, {
            method: "POST",
            headers: this.headers(),
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Canton onboarding failed: ${res.status} ${text}`);
        }

        const json = await res.json();
        // The exercise result contains the created BridgeUserAgreement CID
        const created = json.result?.exerciseResult;
        if (!created) return null;
        return { contractId: typeof created === "string" ? created : JSON.stringify(created) };
    }
}

const operatorClient = new CantonOperatorClient();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { partyId } = body;

        if (!partyId || typeof partyId !== "string") {
            return NextResponse.json({ success: false, error: "partyId required" }, { status: 400 });
        }

        // Check if operator JWT is configured
        if (!process.env.CANTON_UTILITY_OPERATOR_JWT) {
            return NextResponse.json({
                success: false,
                error: "Canton onboarding requires CANTON_UTILITY_OPERATOR_JWT to be configured on the server.",
                selfService: false,
            }, { status: 503 });
        }

        const result = await operatorClient.onboardUser(partyId);

        if (!result) {
            return NextResponse.json({ success: false, error: "Onboarding exercise returned no BridgeUserAgreement CID" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                bridgeAgreementCid: result.contractId,
                partyId,
                message: "BridgeUserAgreement created. User is now onboarded for xReserve bridge operations.",
            },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[/api/canton/onboard]", message);
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
