// src/app/api/bridge/route.ts
// POST /api/bridge — Get bridge route with steps.
//
// Routes ALL bridge requests through the unified routing engine,
// which automatically selects Canton xReserve adapter for Canton routes
// and LI.FI for all other cross-chain routes.
//
// Previously this called lifiAdapter.getRoute() directly, which meant
// Canton bridge requests were incorrectly routed to LI.FI and failed.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    resolveRoute,
    registerEvmSwapAdapter,
    registerSolanaSwapAdapter,
    registerBridgeAdapter,
    registerCantonSwapAdapter,
    registerCantonBridgeAdapter,
    registerSuiSwapAdapter,
    registerSuiBridgeAdapter,
} from "@/lib/routing/routingEngine";
import { paraswapAdapter } from "@/lib/adapters/evm/paraswapAdapter";
import { jupiterAdapter } from "@/lib/adapters/solana/jupiterAdapter";
import { lifiAdapter } from "@/lib/adapters/bridge/lifiAdapter";
import { cantonSwapAdapter } from "@/lib/adapters/canton/cantonSwapAdapter";
import { cantonBridgeAdapterWrapper } from "@/lib/adapters/canton/cantonBridgeAdapterWrapper";
import { deBridgeAdapter } from "@/lib/adapters/bridge/deBridgeAdapter";
import { suiSwapAdapter } from "@/lib/adapters/sui/suiSwapAdapter";
import { suiBridgeAdapter } from "@/lib/adapters/sui/suiBridgeAdapter";
import {
    isEvmChain,
} from "@/lib/chains/chainConfig";

registerEvmSwapAdapter(paraswapAdapter);
registerSolanaSwapAdapter(jupiterAdapter);
registerBridgeAdapter(lifiAdapter);                          // default cross-chain
registerCantonSwapAdapter(cantonSwapAdapter);               // Canton ↔ Canton swaps
registerCantonBridgeAdapter(cantonBridgeAdapterWrapper);    // ETH ↔ Canton bridge
registerSuiSwapAdapter(suiSwapAdapter);                     // Sui swaps (Aftermath + Cetus)
registerSuiBridgeAdapter(suiBridgeAdapter);                 // Sui bridges (deBridge + Wormhole)

const BridgeRouteRequestSchema = z.object({
    fromChainId: z.string(),
    toChainId: z.string(),
    fromTokenAddress: z.string(),
    toTokenAddress: z.string(),
    amount: z.string(),
    slippageBps: z.number().default(50),
    senderAddress: z.string().optional(),
    recipientAddress: z.string().optional(),
    mode: z.enum(["AUTO", "SWAP_ONLY", "BRIDGE_ONLY"]).default("BRIDGE_ONLY"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = BridgeRouteRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    code: "VALIDATION_ERROR",
                    message: "Invalid bridge request",
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        // Use the full routing engine — Canton routes use Canton adapter, others use LI.FI
        const result = await resolveRoute({
            ...parsed.data,
            mode: parsed.data.mode,
        });

        // For EVM→EVM routes: if LI.FI fails, auto-fallback to deBridge DLN
        const { fromChainId, toChainId } = parsed.data;
        const isEvmBridge =
            isEvmChain(fromChainId) &&
            isEvmChain(toChainId) &&
            fromChainId !== toChainId;

        if (!result.success && isEvmBridge) {
            console.log(`[bridge] LI.FI failed (${result.error.message}) — trying deBridge DLN fallback`);
            const fallback = await deBridgeAdapter.getRoute({
                fromChainId,
                toChainId,
                fromTokenAddress: parsed.data.fromTokenAddress,
                toTokenAddress: parsed.data.toTokenAddress,
                amount: parsed.data.amount,
                slippageBps: parsed.data.slippageBps,
                senderAddress: parsed.data.senderAddress,
                recipientAddress: parsed.data.recipientAddress,
            });
            if (fallback.success && fallback.toAmount) {
                // Build a minimal Route from the deBridge result
                const steps = (fallback.steps || []).map((s) => ({ ...s, status: "pending" as const }));
                return NextResponse.json({
                    routeId: crypto.randomUUID(),
                    mode: parsed.data.mode,
                    routeType: "bridge",
                    provider: "deBridge DLN",
                    fromChainId,
                    toChainId,
                    fromToken: { address: parsed.data.fromTokenAddress, symbol: "", decimals: 0 },
                    toToken: { address: parsed.data.toTokenAddress, symbol: "", decimals: 0 },
                    fromAmount: parsed.data.amount,
                    toAmount: fallback.toAmount,
                    toAmountMin: fallback.toAmountMin || fallback.toAmount,
                    steps,
                    fees: fallback.fees || [],
                    etaSeconds: fallback.etaSeconds,
                    exchangeRate: fallback.exchangeRate,
                    priceImpact: fallback.priceImpact,
                    routeReason: `LI.FI unavailable — routed via deBridge DLN`,
                    createdAt: Date.now(),
                });
            }
            // Both failed
            return NextResponse.json(
                { code: "BRIDGE_ROUTE_FAILED", message: `LI.FI: ${result.error.message}. deBridge: ${fallback.error}` },
                { status: 400 }
            );
        }

        if (!result.success) {
            return NextResponse.json(
                { code: result.error.code, message: result.error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(result.route);
    } catch (err) {
        console.error("Bridge API error:", err);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to process bridge request" },
            { status: 500 }
        );
    }
}
