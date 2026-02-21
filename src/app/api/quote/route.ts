// src/app/api/quote/route.ts
// POST /api/quote — Unified quote endpoint
// Server-side: injects API keys, calls provider adapters, returns validated quote.

import { NextRequest, NextResponse } from "next/server";
import { QuoteRequestSchema } from "@/lib/schemas/quote";
import { resolveRoute, registerEvmSwapAdapter, registerSolanaSwapAdapter, registerBridgeAdapter, registerCantonSwapAdapter, registerCantonBridgeAdapter, registerSuiSwapAdapter, registerSuiBridgeAdapter } from "@/lib/routing/routingEngine";
import { paraswapAdapter } from "@/lib/adapters/evm/paraswapAdapter";
import { jupiterAdapter } from "@/lib/adapters/solana/jupiterAdapter";
import { lifiAdapter } from "@/lib/adapters/bridge/lifiAdapter";
import { cantonSwapAdapter } from "@/lib/adapters/canton/cantonSwapAdapter";
import { cantonBridgeAdapterWrapper } from "@/lib/adapters/canton/cantonBridgeAdapterWrapper";
import { deBridgeAdapter } from "@/lib/adapters/bridge/deBridgeAdapter";
import { suiSwapAdapter } from "@/lib/adapters/sui/suiSwapAdapter";
import { suiBridgeAdapter } from "@/lib/adapters/sui/suiBridgeAdapter";
import { findToken } from "@/lib/tokens/tokenList";

// Register adapters on module load
registerEvmSwapAdapter(paraswapAdapter);
registerSolanaSwapAdapter(jupiterAdapter);
registerBridgeAdapter(lifiAdapter);              // primary EVM cross-chain bridge
registerCantonSwapAdapter(cantonSwapAdapter);
registerCantonBridgeAdapter(cantonBridgeAdapterWrapper);
registerSuiSwapAdapter(suiSwapAdapter);
registerSuiBridgeAdapter(suiBridgeAdapter);
void deBridgeAdapter; // loaded — available via direct import for multi-provider flow

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request with zod
        const parsed = QuoteRequestSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    code: "VALIDATION_ERROR",
                    message: "Invalid quote request",
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const result = await resolveRoute(parsed.data);

        if (!result.success) {
            return NextResponse.json(result.error, { status: 400 });
        }

        // Enrich token info from our list
        const route = result.route;
        const fromTokenInfo = findToken(route.fromChainId, route.fromToken.address);
        const toTokenInfo = findToken(route.toChainId, route.toToken.address);

        if (fromTokenInfo) {
            route.fromToken.symbol = fromTokenInfo.symbol;
            route.fromToken.decimals = fromTokenInfo.decimals;
        }
        if (toTokenInfo) {
            route.toToken.symbol = toTokenInfo.symbol;
            route.toToken.decimals = toTokenInfo.decimals;
        }

        return NextResponse.json(route);
    } catch (err) {
        console.error("Quote API error:", err);
        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message: "Failed to process quote request",
            },
            { status: 500 }
        );
    }
}
