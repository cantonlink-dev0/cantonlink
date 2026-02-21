// src/lib/adapters/sui/suiSwapAdapter.ts
// Sui DEX swap adapter — routes through available Sui DEX aggregators.
//
// Primary:  Cetus Aggregator (https://api-sui.cetus.zone/router_v2)
//           — verified live, free REST API, no API key required
//           — response: {code:200, data:{amount_in, amount_out, deviation_ratio, routes}}
//
// Fallback: Aftermath Finance (https://aftermath.finance/api)
//           — NOTE: REST trade endpoints return 404 as of Feb 2026.
//           — Aftermath moved to SDK-only for swap routing.
//           — Kept as fallback in case REST endpoints come back.
//
// Sui token addresses use the Move object format:
//   0x2::sui::SUI (native SUI)
//   0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN (USDC)

import type {
    SwapAdapter,
    AdapterQuoteParams,
    AdapterQuoteResult,
} from "@/lib/routing/routingEngine";

const AFTERMATH_BASE = "https://aftermath.finance/api";
const CETUS_AGGREGATOR_BASE = "https://api-sui.cetus.zone/router_v2";

/**
 * Sui swap adapter implementing the SwapAdapter interface.
 *
 * Primary: Cetus aggregator (verified live, real REST API).
 * Fallback: Aftermath Finance (REST API currently 404, may return).
 */
export const suiSwapAdapter: SwapAdapter = {
    name: "Cetus",

    async getQuote(params: AdapterQuoteParams): Promise<AdapterQuoteResult> {
        // Try Cetus first (verified live), then Aftermath fallback
        const cetusResult = await tryCetus(params);
        if (cetusResult.success) return cetusResult;

        console.log(`[sui-swap] Cetus failed: ${cetusResult.error} — trying Aftermath fallback`);
        return tryAftermath(params);
    },
};

async function tryCetus(params: AdapterQuoteParams): Promise<AdapterQuoteResult> {
    try {
        // Cetus Aggregator API
        // GET /find_routes?from=<coinType>&target=<coinType>&amount=<amount>&by_amount_in=true
        // Real response: {code:200, msg:"Success", data:{amount_in, amount_out, deviation_ratio, routes:[...]}}
        const url = new URL(`${CETUS_AGGREGATOR_BASE}/find_routes`);
        url.searchParams.set("from", params.fromTokenAddress);
        url.searchParams.set("target", params.toTokenAddress);
        url.searchParams.set("amount", params.amount);
        url.searchParams.set("by_amount_in", "true");

        const response = await fetch(url.toString(), {
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: `Cetus route error (${response.status}): ${errText}` };
        }

        // Cetus response shape: {code: 200, msg: "Success", data: {amount_in, amount_out, deviation_ratio, routes}}
        const raw = await response.json() as {
            code?: number;
            data?: {
                amount_out?: number | string;
                amount_in?: number | string;
                deviation_ratio?: string;
                routes?: unknown[];
            };
        };

        if (raw.code !== 200 || !raw.data?.amount_out) {
            return { success: false, error: `Cetus: ${raw.code !== 200 ? 'API error ' + raw.code : 'no output amount returned'}` };
        }

        const toAmount = String(raw.data.amount_out);
        const inAmt = parseFloat(params.amount);
        const outAmt = parseFloat(toAmount);
        const slippageMultiplier = 1 - params.slippageBps / 10_000;

        return {
            success: true,
            toAmount,
            toAmountMin: String(Math.floor(outAmt * slippageMultiplier)),
            exchangeRate: inAmt > 0 ? String(outAmt / inAmt) : undefined,
            priceImpact: raw.data.deviation_ratio ? Math.abs(parseFloat(raw.data.deviation_ratio) * 100) : undefined,
            fees: [],
        };
    } catch (err) {
        return {
            success: false,
            error: `Cetus adapter error: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}

async function tryAftermath(params: AdapterQuoteParams): Promise<AdapterQuoteResult> {
    try {
        // Aftermath Trade API: POST /trade/route
        // NOTE: Returns 404 as of Feb 2026. Kept as fallback.
        const routeUrl = `${AFTERMATH_BASE}/trade/route`;
        const response = await fetch(routeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                coinInType: params.fromTokenAddress,
                coinOutType: params.toTokenAddress,
                coinInAmount: params.amount,
                slippage: params.slippageBps / 10_000,
            }),
            signal: AbortSignal.timeout(10_000),
        });

        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: `Aftermath route error (${response.status}): ${errText}` };
        }

        const data = await response.json() as {
            coinOut?: { amount?: string };
            spotPrice?: number;
            priceImpact?: number;
            routes?: unknown[];
        };

        if (!data.coinOut?.amount) {
            return { success: false, error: "Aftermath returned no output amount" };
        }

        const toAmount = data.coinOut.amount;
        const inAmt = parseFloat(params.amount);
        const outAmt = parseFloat(toAmount);

        const slippageMultiplier = 1 - params.slippageBps / 10_000;
        const toAmountMin = String(Math.floor(outAmt * slippageMultiplier));

        const result: AdapterQuoteResult = {
            success: true,
            toAmount,
            toAmountMin,
            exchangeRate: inAmt > 0 ? String(outAmt / inAmt) : undefined,
            priceImpact: data.priceImpact,
            fees: [],
        };

        // If we have a sender, try to get the transaction
        if (params.senderAddress) {
            try {
                const txUrl = `${AFTERMATH_BASE}/trade/transaction`;
                const txResponse = await fetch(txUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        coinInType: params.fromTokenAddress,
                        coinOutType: params.toTokenAddress,
                        coinInAmount: params.amount,
                        slippage: params.slippageBps / 10_000,
                        walletAddress: params.senderAddress,
                    }),
                    signal: AbortSignal.timeout(10_000),
                });

                if (txResponse.ok) {
                    const txData = await txResponse.json() as { tx?: string };
                    if (txData.tx) {
                        result.transactionData = {
                            serializedTransaction: txData.tx,
                        };
                    }
                }
            } catch {
                // Transaction build failed — quote still valid
            }
        }

        return result;
    } catch (err) {
        return {
            success: false,
            error: `Aftermath adapter error: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}
