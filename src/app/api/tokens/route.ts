// src/app/api/tokens/route.ts
// GET /api/tokens?chainId=...&search=...
// Dynamic token search — returns tokens from our static list + provider search

import { NextRequest, NextResponse } from "next/server";
import { getTokensForChain, TOKEN_LIST } from "@/lib/tokens/tokenList";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const chainId = searchParams.get("chainId");
        const search = searchParams.get("search")?.toLowerCase();

        let tokens = chainId
            ? getTokensForChain(chainId)
            : [...TOKEN_LIST];

        // Filter by search term if provided
        if (search) {
            tokens = tokens.filter(
                (t) =>
                    t.symbol.toLowerCase().includes(search) ||
                    t.name.toLowerCase().includes(search) ||
                    t.address.toLowerCase().includes(search)
            );
        }

        return NextResponse.json({ tokens });
    } catch (err) {
        console.error("Tokens API error:", err);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to search tokens" },
            { status: 500 }
        );
    }
}
