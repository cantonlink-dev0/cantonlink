// src/lib/adapters/evm/paraswapAdapter.ts
// ParaSwap API v5 adapter for EVM swaps — NO API KEY REQUIRED
// Docs: https://developers.paraswap.network/api/get-rate-for-a-token-pair

import type {
    SwapAdapter,
    AdapterQuoteParams,
    AdapterQuoteResult,
} from "@/lib/routing/routingEngine";

const PARASWAP_BASE_URL = "https://apiv5.paraswap.io";

/**
 * Map chain ID to ParaSwap network number.
 * ParaSwap uses standard EVM chain IDs.
 */
function getNetworkId(chainId: string): number {
    return parseInt(chainId, 10);
}

/**
 * ParaSwap adapter implementing the SwapAdapter interface.
 *
 * Endpoints used:
 * - GET /prices          — get best swap rate (no tx data)
 * - POST /transactions   — build swap transaction data
 *
 * 100% free, no API key, no signup, no auth.
 * Supports: Ethereum, Arbitrum, Optimism, Polygon, BSC, Avalanche, Base, Fantom, zkSync, and more.
 */
export const paraswapAdapter: SwapAdapter = {
    name: "ParaSwap",

    async getQuote(params: AdapterQuoteParams): Promise<AdapterQuoteResult> {
        try {
            const networkId = getNetworkId(params.chainId);

            // Step 1: Get price/rate
            const priceParams = new URLSearchParams({
                srcToken: params.fromTokenAddress,
                destToken: params.toTokenAddress,
                amount: params.amount,
                srcDecimals: "18",    // Will be corrected by ParaSwap
                destDecimals: "18",   // Will be corrected by ParaSwap
                side: "SELL",
                network: String(networkId),
                otherExchangePrices: "true",
                includeContractMethods: "simpleSwap,multiSwap,megaSwap",
            });

            const priceUrl = `${PARASWAP_BASE_URL}/prices?${priceParams.toString()}`;
            const priceResponse = await fetch(priceUrl, {
                headers: { Accept: "application/json" },
            });

            if (!priceResponse.ok) {
                const errorBody = await priceResponse.text();
                return {
                    success: false,
                    error: `ParaSwap price error (${priceResponse.status}): ${errorBody}`,
                };
            }

            const priceData = await priceResponse.json();

            // ParaSwap /prices response:
            // { priceRoute: { destAmount, srcAmount, gasCost, bestRoute, ... } }
            if (!priceData.priceRoute) {
                return {
                    success: false,
                    error: "No swap route found for this token pair.",
                };
            }

            const route = priceData.priceRoute;

            const result: AdapterQuoteResult = {
                success: true,
                toAmount: route.destAmount,
                toAmountMin: route.destAmount, // Slippage applied in /transactions
                estimatedGas: String(route.gasCost || "0"),
                fees: [],
            };

            // Calculate exchange rate
            if (route.destAmount && route.srcAmount) {
                const rate = parseFloat(route.destAmount) / parseFloat(route.srcAmount);
                result.exchangeRate = String(rate);
            }

            // Gas fee in USD
            if (route.gasCostUSD) {
                result.fees = [{
                    name: "Gas cost",
                    amount: route.gasCostUSD,
                    token: "USD",
                    amountUsd: parseFloat(route.gasCostUSD) || 0,
                }];
            }

            // Step 2: If sender address provided, build transaction
            if (params.senderAddress) {
                const txBody = {
                    srcToken: params.fromTokenAddress,
                    destToken: params.toTokenAddress,
                    srcAmount: params.amount,
                    destAmount: route.destAmount,
                    priceRoute: route,
                    userAddress: params.senderAddress,
                    partner: "cantonlink", // CantonLink integrator ID for revenue share
                    srcDecimals: route.srcDecimals || 18,
                    destDecimals: route.destDecimals || 18,
                    slippage: params.slippageBps, // ParaSwap uses bps
                };

                const txResponse = await fetch(
                    `${PARASWAP_BASE_URL}/transactions/${networkId}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Accept: "application/json",
                        },
                        body: JSON.stringify(txBody),
                    }
                );

                if (txResponse.ok) {
                    const txData = await txResponse.json();
                    // ParaSwap /transactions response:
                    // { to, from, value, data, gasPrice, gas, chainId }
                    result.transactionData = {
                        to: txData.to,
                        data: txData.data,
                        value: String(txData.value || "0"),
                        gasLimit: String(txData.gas || "0"),
                    };
                }
            }

            return result;
        } catch (err) {
            return {
                success: false,
                error: `ParaSwap adapter error: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
    },
};
