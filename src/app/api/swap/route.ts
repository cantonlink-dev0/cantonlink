// src/app/api/swap/route.ts
// POST /api/swap — Build swap transaction data
// Called after user confirms a quote. Returns tx data for the wallet to sign.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerEvmSwapAdapter, registerSolanaSwapAdapter, registerSuiSwapAdapter, registerCantonSwapAdapter } from "@/lib/routing/routingEngine";
import { paraswapAdapter } from "@/lib/adapters/evm/paraswapAdapter";
import { jupiterAdapter } from "@/lib/adapters/solana/jupiterAdapter";
import { suiSwapAdapter } from "@/lib/adapters/sui/suiSwapAdapter";
import { cantonSwapAdapter } from "@/lib/adapters/canton/cantonSwapAdapter";
import { isEvmChain, isSolanaChain, isSuiChain, isCantonChain } from "@/lib/chains/chainConfig";

// Ensure adapters are registered
registerEvmSwapAdapter(paraswapAdapter);
registerSolanaSwapAdapter(jupiterAdapter);
registerSuiSwapAdapter(suiSwapAdapter);
registerCantonSwapAdapter(cantonSwapAdapter);

const SwapTxRequestSchema = z.object({
    chainId: z.string(),
    fromTokenAddress: z.string(),
    toTokenAddress: z.string(),
    amount: z.string(),
    slippageBps: z.number().default(50),
    senderAddress: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = SwapTxRequestSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    code: "VALIDATION_ERROR",
                    message: "Invalid swap request",
                    details: parsed.error.flatten(),
                },
                { status: 400 }
            );
        }

        const { chainId, fromTokenAddress, toTokenAddress, amount, slippageBps, senderAddress } =
            parsed.data;

        let adapter;
        if (isSolanaChain(chainId)) {
            adapter = jupiterAdapter;
        } else if (isSuiChain(chainId)) {
            adapter = suiSwapAdapter;
        } else if (isEvmChain(chainId)) {
            adapter = paraswapAdapter;
        } else if (isCantonChain(chainId)) {
            adapter = cantonSwapAdapter;
        } else {
            return NextResponse.json(
                { code: "UNSUPPORTED_CHAIN", message: `No swap adapter for chain ${chainId}` },
                { status: 400 }
            );
        }

        const result = await adapter.getQuote({
            chainId,
            fromTokenAddress,
            toTokenAddress,
            amount,
            slippageBps,
            senderAddress,
        });

        if (!result.success) {
            return NextResponse.json(
                { code: "SWAP_FAILED", message: result.error || "Failed to build swap transaction" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            toAmount: result.toAmount,
            toAmountMin: result.toAmountMin,
            transactionData: result.transactionData,
            estimatedGas: result.estimatedGas,
        });
    } catch (err) {
        console.error("Swap API error:", err);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to process swap request" },
            { status: 500 }
        );
    }
}
