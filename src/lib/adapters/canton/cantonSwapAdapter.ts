// src/lib/adapters/canton/cantonSwapAdapter.ts
// Canton Network swap adapter — handles token swaps within Canton Network.
//
// PRICE DATA: Uses CoinGecko API for live CC/USD price.
//   CoinGecko API ID for Canton Coin: "canton-network"
//   Endpoint: https://api.coingecko.com/api/v3/simple/price?ids=canton-network&vs_currencies=usd
//   No API key required for basic price queries (rate-limited at ~30 req/min).
//
// SWAP EXECUTION: Canton Network does NOT have a public on-chain DEX with a
//   REST API like Uniswap or Jupiter. Canton token transfers are DAML-based
//   and go through the Splice Wallet or participant node's Ledger API.
//
//   This adapter provides PRICE QUOTES using CoinGecko spot rates.
//   Actual token transfers are handled by the user's Canton wallet
//   (Splice Wallet, DA Hub, etc.) — not by an external DEX.
//
// STABLECOIN PAIRS: USDC↔USDT are 1:1 (both are USD-pegged stablecoins on Canton).

import type { SwapAdapter, AdapterQuoteParams, AdapterQuoteResult } from "@/lib/routing/routingEngine";

// Canton token address identifiers (as defined in tokenList.ts)
const CANTON_NATIVE = "canton:native"; // CC (Canton Coin)
const CANTON_USDC = "canton:usdc";     // USDCx on Canton (Circle xReserve)
const CANTON_USDT = "canton:usdt";     // USDT on Canton

// Canton token decimals
const CANTON_DECIMALS: Record<string, number> = {
    [CANTON_NATIVE]: 10, // CC uses 10 decimal places
    [CANTON_USDC]: 6,
    [CANTON_USDT]: 6,
};

// Cache for CoinGecko price to avoid hammering the API
let ccPriceCache: { price: number; fetchedAt: number } | null = null;
const PRICE_CACHE_TTL_MS = 60_000; // 1 minute cache

/**
 * Fetch live CC/USD price from CoinGecko.
 * Falls back to last cached price, then to $0.166 (approximate as of Feb 2026).
 */
async function getCCPriceUSD(): Promise<number> {
    // Return cached price if fresh
    if (ccPriceCache && Date.now() - ccPriceCache.fetchedAt < PRICE_CACHE_TTL_MS) {
        return ccPriceCache.price;
    }

    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=canton-network&vs_currencies=usd",
            {
                headers: {
                    Accept: "application/json",
                    "User-Agent": "CantonLink/1.0 money-move-2026",
                },
                // 5 second timeout
                signal: AbortSignal.timeout(5000),
            }
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();
        const price = data?.["canton-network"]?.usd;

        if (typeof price !== "number" || price <= 0) {
            throw new Error("Invalid price data from CoinGecko");
        }

        // Update cache
        ccPriceCache = { price, fetchedAt: Date.now() };
        return price;

    } catch (err) {
        // Return stale cache if available
        if (ccPriceCache) {
            console.warn("[Canton] CoinGecko price fetch failed, using cached price:", err);
            return ccPriceCache.price;
        }
        // Final fallback: approximate CC price
        console.warn("[Canton] CoinGecko price fetch failed, using fallback price:", err);
        return 0.166;
    }
}

/**
 * Calculate exchange rate between two Canton tokens.
 * CC rate is derived from live CoinGecko price.
 * Stablecoin pairs are 1:1.
 */
async function getExchangeRate(
    fromToken: string,
    toToken: string
): Promise<number | null> {
    // Stablecoin ↔ stablecoin: 1:1
    const stablecoins = [CANTON_USDC, CANTON_USDT];
    if (stablecoins.includes(fromToken) && stablecoins.includes(toToken)) {
        return 1.0;
    }

    const ccPriceUSD = await getCCPriceUSD();

    // CC → stablecoin: rate = CC price in USD
    if (fromToken === CANTON_NATIVE && stablecoins.includes(toToken)) {
        return ccPriceUSD;
    }

    // stablecoin → CC: rate = 1 / CC price
    if (stablecoins.includes(fromToken) && toToken === CANTON_NATIVE) {
        return 1 / ccPriceUSD;
    }

    return null; // Unsupported pair
}

/**
 * Canton Network swap adapter.
 *
 * Provides price quotes using live CoinGecko data.
 * Returns a DAML transfer intent — the user's Canton wallet handles execution.
 *
 * NOTE: Canton does not have a public DEX API. Swaps are priced at CoinGecko
 * spot rate. The actual transfer goes through the Splice Wallet or the
 * Canton Ledger API (DAML exercises on Splice Amulet / Transfer templates).
 */
export const cantonSwapAdapter: SwapAdapter = {
    name: "Canton Network",

    async getQuote(params: AdapterQuoteParams): Promise<AdapterQuoteResult> {
        try {
            const { fromTokenAddress, toTokenAddress, amount } = params;

            // Validate Canton-to-Canton swap
            if (!fromTokenAddress.startsWith("canton:") || !toTokenAddress.startsWith("canton:")) {
                return {
                    success: false,
                    error: "Canton swap adapter only handles canton: token addresses",
                };
            }

            if (fromTokenAddress === toTokenAddress) {
                return {
                    success: false,
                    error: "Cannot swap a token for itself",
                };
            }

            const fromAmountFloat = parseFloat(amount);
            if (isNaN(fromAmountFloat) || fromAmountFloat <= 0) {
                return { success: false, error: "Invalid amount" };
            }

            // Get live exchange rate
            const rate = await getExchangeRate(fromTokenAddress, toTokenAddress);
            if (rate === null) {
                return {
                    success: false,
                    error: `No Canton swap route for ${fromTokenAddress} → ${toTokenAddress}`,
                };
            }

            const fromDecimals = CANTON_DECIMALS[fromTokenAddress] ?? 10;
            const toDecimals = CANTON_DECIMALS[toTokenAddress] ?? 10;

            // Apply 0.3% swap fee (standard Splice transfer fee tier)
            const FEE_BPS = 30;
            const toAmountFloat = fromAmountFloat * rate * (1 - FEE_BPS / 10000);
            const toAmountMinFloat = toAmountFloat * (1 - params.slippageBps / 10000);

            // Price impact: minimal for stablecoin pairs, small for CC pairs
            const priceImpact = fromAmountFloat > 100000 ? 0.5 : 0.05;

            // Fee in USD terms
            const ccPriceUSD = await getCCPriceUSD();
            const fromValueUSD = fromTokenAddress === CANTON_NATIVE
                ? fromAmountFloat * ccPriceUSD
                : fromAmountFloat; // stablecoins are 1:1 USD
            const feeUSD = fromValueUSD * (FEE_BPS / 10000);

            // Build DAML transfer intent
            // The user's Canton wallet (Splice Wallet, DA Hub, etc.) executes this
            const damlIntent = {
                type: "canton:transfer",
                version: "1",
                fromToken: fromTokenAddress,
                toToken: toTokenAddress,
                fromAmount: Math.round(fromAmountFloat * Math.pow(10, fromDecimals)).toString(),
                toAmountMin: Math.round(toAmountMinFloat * Math.pow(10, toDecimals)).toString(),
                slippageBps: params.slippageBps,
                deadline: Math.floor(Date.now() / 1000) + 300, // 5 min deadline
            };

            return {
                success: true,
                toAmount: Math.round(toAmountFloat * Math.pow(10, toDecimals)).toString(),
                toAmountMin: Math.round(toAmountMinFloat * Math.pow(10, toDecimals)).toString(),
                exchangeRate: rate.toFixed(8),
                priceImpact,
                estimatedGas: "0", // Canton has no gas fees — network fees are in CC
                fees: [
                    {
                        name: "Canton Network fee (0.3%)",
                        amount: (fromAmountFloat * (FEE_BPS / 10000)).toFixed(fromDecimals),
                        token: fromTokenAddress === CANTON_NATIVE ? "CC" : fromTokenAddress.replace("canton:", "").toUpperCase(),
                        amountUsd: feeUSD,
                    },
                ],
                transactionData: {
                    serializedTransaction: JSON.stringify(damlIntent),
                },
            };
        } catch (err) {
            return {
                success: false,
                error: `Canton swap adapter error: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
    },
};
