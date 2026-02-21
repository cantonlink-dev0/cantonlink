// src/lib/adapters/evm/oneInchAdapter.ts
// 1inch Swap API v6.0 adapter
// Docs: https://portal.1inch.dev/documentation/swap/swagger

import type {
    SwapAdapter,
    AdapterQuoteParams,
    AdapterQuoteResult,
} from "@/lib/routing/routingEngine";

const ONEINCH_BASE_URL = "https://api.1inch.dev/swap/v6.0";

function getApiKey(): string {
    return process.env.ONEINCH_API_KEY || "";
}

/**
 * 1inch adapter implementing the SwapAdapter interface.
 *
 * Endpoints used:
 * - GET /{chainId}/quote — get a swap quote (no tx data)
 * - GET /{chainId}/swap  — get a swap quote + transaction data
 */
export const oneInchAdapter: SwapAdapter = {
    name: "1inch",

    async getQuote(params: AdapterQuoteParams): Promise<AdapterQuoteResult> {
        const apiKey = getApiKey();
        if (!apiKey) {
            return {
                success: false,
                error: "ONEINCH_API_KEY is not set. Add it to .env.local to enable EVM swaps.",
            };
        }

        try {
            // If we have a sender address, use /swap to get transaction data.
            // Otherwise, use /quote for quote-only.
            const endpoint = params.senderAddress ? "swap" : "quote";
            const chainId = params.chainId;

            const searchParams = new URLSearchParams({
                src: params.fromTokenAddress,
                dst: params.toTokenAddress,
                amount: params.amount,
                slippage: String(params.slippageBps / 100), // 1inch uses percentage, not bps
                includeGas: "true",
            });

            if (params.senderAddress) {
                searchParams.set("from", params.senderAddress);
                // Disable built-in approve estimate — we handle approvals separately
                searchParams.set("disableEstimate", "true");
            }

            const url = `${ONEINCH_BASE_URL}/${chainId}/${endpoint}?${searchParams.toString()}`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    Accept: "application/json",
                },
            });

            if (!response.ok) {
                const errorBody = await response.text();
                return {
                    success: false,
                    error: `1inch API error (${response.status}): ${errorBody}`,
                };
            }

            const data = await response.json();

            // 1inch v6 response shape:
            // /quote: { dstAmount, gas }
            // /swap:  { dstAmount, tx: { from, to, data, value, gas } }

            const result: AdapterQuoteResult = {
                success: true,
                toAmount: data.dstAmount,
                toAmountMin: data.dstAmount, // 1inch applies slippage internally
                estimatedGas: String(data.gas || data.tx?.gas || "0"),
                fees: [],
            };

            // Calculate exchange rate
            if (data.dstAmount && params.amount) {
                const rate =
                    parseFloat(data.dstAmount) / parseFloat(params.amount);
                result.exchangeRate = String(rate);
            }

            // If /swap endpoint was used, include transaction data
            if (data.tx) {
                result.transactionData = {
                    to: data.tx.to,
                    data: data.tx.data,
                    value: String(data.tx.value || "0"),
                    gasLimit: String(data.tx.gas || "0"),
                };
            }

            return result;
        } catch (err) {
            return {
                success: false,
                error: `1inch adapter error: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
    },
};
