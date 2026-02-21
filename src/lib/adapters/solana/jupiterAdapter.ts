// src/lib/adapters/solana/jupiterAdapter.ts
// Jupiter Swap API adapter for Solana swaps
// Docs: https://station.jup.ag/docs/apis/swap-api
// Note: Original v6 endpoint (quote-api.jup.ag/v6) was sunsetted.
// Using QuickNode public relay which maintains the same response format.

import type {
    SwapAdapter,
    AdapterQuoteParams,
    AdapterQuoteResult,
} from "@/lib/routing/routingEngine";

const JUPITER_BASE_URL = "https://public.jupiterapi.com";

/**
 * Jupiter adapter implementing the SwapAdapter interface.
 *
 * Endpoints used:
 * - GET /quote             — get a swap quote
 * - POST /swap             — get a serialized transaction for signing
 * - GET /tokens            — search for tokens (for dynamic token discovery)
 *
 * Jupiter API is free and public — no API key required.
 */
export const jupiterAdapter: SwapAdapter = {
    name: "Jupiter",

    async getQuote(params: AdapterQuoteParams): Promise<AdapterQuoteResult> {
        try {
            // Step 1: Get quote
            const quoteParams = new URLSearchParams({
                inputMint: params.fromTokenAddress,
                outputMint: params.toTokenAddress,
                amount: params.amount, // raw lamports/token units
                slippageBps: String(params.slippageBps),
            });

            const quoteUrl = `${JUPITER_BASE_URL}/quote?${quoteParams.toString()}`;
            const quoteResponse = await fetch(quoteUrl, {
                signal: AbortSignal.timeout(8_000), // fail fast if DNS/network unreachable
            });

            if (!quoteResponse.ok) {
                const errorBody = await quoteResponse.text();
                return {
                    success: false,
                    error: `Jupiter quote error (${quoteResponse.status}): ${errorBody}`,
                };
            }

            const quoteData = await quoteResponse.json();

            // Jupiter v6 /quote response:
            // {
            //   inputMint, outputMint, inAmount, outAmount, otherAmountThreshold,
            //   swapMode, slippageBps, priceImpactPct, routePlan, contextSlot
            // }

            const result: AdapterQuoteResult = {
                success: true,
                toAmount: quoteData.outAmount,
                toAmountMin: quoteData.otherAmountThreshold,
                priceImpact: quoteData.priceImpactPct
                    ? parseFloat(quoteData.priceImpactPct)
                    : undefined,
                fees: [],
            };

            // Calculate exchange rate
            if (quoteData.outAmount && quoteData.inAmount) {
                const rate =
                    parseFloat(quoteData.outAmount) / parseFloat(quoteData.inAmount);
                result.exchangeRate = String(rate);
            }

            // Step 2: If we have a sender address, get the swap transaction
            if (params.senderAddress) {
                const swapResponse = await fetch(`${JUPITER_BASE_URL}/swap`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        quoteResponse: quoteData,
                        userPublicKey: params.senderAddress,
                        wrapAndUnwrapSol: true,
                        dynamicComputeUnitLimit: true,
                        prioritizationFeeLamports: "auto",
                    }),
                });

                if (!swapResponse.ok) {
                    const errorBody = await swapResponse.text();
                    return {
                        success: false,
                        error: `Jupiter swap error (${swapResponse.status}): ${errorBody}`,
                    };
                }

                const swapData = await swapResponse.json();

                // Jupiter v6 /swap response:
                // { swapTransaction: "<base64 encoded transaction>" }
                result.transactionData = {
                    serializedTransaction: swapData.swapTransaction,
                };
            }

            return result;
        } catch (err) {
            return {
                success: false,
                error: `Jupiter adapter error: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
    },
};
