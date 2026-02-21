// src/app/api/bridge/status/route.ts
// GET /api/bridge/status?txHash=...&fromChain=...&toChain=...&bridge=...
// Polls bridge status from LI.FI

import { NextRequest, NextResponse } from "next/server";
import { getLifiBridgeStatus } from "@/lib/adapters/bridge/lifiAdapter";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const txHash = searchParams.get("txHash");
        const fromChain = searchParams.get("fromChain");
        const toChain = searchParams.get("toChain");
        const bridge = searchParams.get("bridge") || undefined;

        if (!txHash || !fromChain || !toChain) {
            return NextResponse.json(
                {
                    code: "VALIDATION_ERROR",
                    message: "txHash, fromChain, and toChain are required query params",
                },
                { status: 400 }
            );
        }

        const status = await getLifiBridgeStatus(txHash, fromChain, toChain, bridge);

        return NextResponse.json(status);
    } catch (err) {
        console.error("Bridge status API error:", err);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to get bridge status" },
            { status: 500 }
        );
    }
}
