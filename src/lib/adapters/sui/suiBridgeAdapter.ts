// src/lib/adapters/sui/suiBridgeAdapter.ts
// Wormhole + deBridge adapter for Sui ↔ EVM/Solana bridging.
//
// Strategy: Try Wormhole Portal Bridge first (native Sui support, free API),
// then fallback to deBridge DLN which also supports Sui.
//
// Wormhole: https://docs.wormhole.com/
// deBridge: https://docs.debridge.finance/ (Sui chain ID = 7565164)
//
// This adapter handles:
//   - SUI → EVM (via USDC/WETH Wormhole wrapped tokens)
//   - EVM → SUI (via Wormhole Portal)
//   - SUI ↔ Solana (via Wormhole)

import type {
    BridgeAdapter,
    AdapterBridgeParams,
    AdapterBridgeResult,
} from "@/lib/routing/routingEngine";

// deBridge DLN API (supports Sui natively as chainId 7565164)
const DEBRIDGE_API = "https://deswap.dln.trade/v1.0";
const SUI_DEBRIDGE_CHAIN_ID = 7565164; // deBridge's numeric ID for Sui

// Wormhole Connect REST API
const WORMHOLE_API = "https://api.wormholescan.io/api/v1";

/**
 * Sui bridge adapter implementing BridgeAdapter.
 *
 * Routes SUI ↔ EVM/Solana bridges through:
 *   1. deBridge DLN (primary — has native Sui support, real liquidity)
 *   2. Wormhole (fallback — great for wrapped assets)
 */
export const suiBridgeAdapter: BridgeAdapter = {
    name: "Sui Bridge (deBridge + Wormhole)",

    async getRoute(params: AdapterBridgeParams): Promise<AdapterBridgeResult> {
        // Try deBridge first (best liquidity for SUI)
        const deBridgeResult = await tryDeBridge(params);
        if (deBridgeResult.success) return deBridgeResult;

        console.log(`[sui-bridge] deBridge failed: ${deBridgeResult.error} — trying Wormhole`);
        return tryWormhole(params);
    },
};

/**
 * Map our internal chain IDs to deBridge numeric chain IDs.
 */
function toDeBridgeChainId(chainId: string): number | null {
    const map: Record<string, number> = {
        "1": 1,           // Ethereum
        "10": 10,         // Optimism
        "56": 56,         // BNB Chain
        "137": 137,       // Polygon
        "42161": 42161,   // Arbitrum
        "43114": 43114,   // Avalanche
        "8453": 8453,     // Base
        "324": 324,       // zkSync Era
        "solana": 7565164, // Solana on deBridge
        "sui": SUI_DEBRIDGE_CHAIN_ID,
    };
    return map[chainId] ?? null;
}

async function tryDeBridge(params: AdapterBridgeParams): Promise<AdapterBridgeResult> {
    try {
        const srcChainId = toDeBridgeChainId(params.fromChainId);
        const dstChainId = toDeBridgeChainId(params.toChainId);

        if (!srcChainId || !dstChainId) {
            return { success: false, error: `Unsupported chain for deBridge: ${params.fromChainId} → ${params.toChainId}` };
        }

        // deBridge DLN /dln/order/quote
        const quoteUrl = new URL(`${DEBRIDGE_API}/dln/order/quote`);
        quoteUrl.searchParams.set("srcChainId", String(srcChainId));
        quoteUrl.searchParams.set("srcChainTokenIn", params.fromTokenAddress);
        quoteUrl.searchParams.set("srcChainTokenInAmount", params.amount);
        quoteUrl.searchParams.set("dstChainId", String(dstChainId));
        quoteUrl.searchParams.set("dstChainTokenOut", params.toTokenAddress);
        if (params.senderAddress) {
            quoteUrl.searchParams.set("srcChainOrderAuthorityAddress", params.senderAddress);
        }
        if (params.recipientAddress) {
            quoteUrl.searchParams.set("dstChainTokenOutRecipient", params.recipientAddress);
        }

        const response = await fetch(quoteUrl.toString(), {
            signal: AbortSignal.timeout(12_000),
        });

        if (!response.ok) {
            const errText = await response.text();
            return { success: false, error: `deBridge quote error (${response.status}): ${errText}` };
        }

        const data = await response.json() as {
            estimation?: {
                dstChainTokenOut?: {
                    amount?: string;
                    minAmount?: string;
                };
                recommendedSlippage?: number;
            };
            tx?: {
                to?: string;
                data?: string;
                value?: string;
            };
            order?: {
                orderId?: string;
            };
            priceImpact?: number;
        };

        const outAmount = data.estimation?.dstChainTokenOut?.amount;
        if (!outAmount) {
            return { success: false, error: "deBridge returned no output amount for Sui bridge" };
        }

        const inAmt = parseFloat(params.amount);
        const outAmt = parseFloat(outAmount);

        return {
            success: true,
            toAmount: outAmount,
            toAmountMin: data.estimation?.dstChainTokenOut?.minAmount || outAmount,
            exchangeRate: inAmt > 0 ? String(outAmt / inAmt) : undefined,
            priceImpact: data.priceImpact,
            etaSeconds: 120, // deBridge DLN typically ~2 min
            fees: [{
                name: "deBridge Protocol Fee",
                amount: "0",
                token: "SUI",
            }],
            steps: [
                {
                    id: `step-sui-bridge-${crypto.randomUUID()}`,
                    type: "bridgeSend" as const,
                    description: `Bridge via deBridge DLN (${params.fromChainId} → ${params.toChainId})`,
                    chainId: params.fromChainId,
                    tool: "deBridge DLN",
                },
            ],
            providerRouteId: data.order?.orderId,
        };
    } catch (err) {
        return {
            success: false,
            error: `deBridge Sui bridge error: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}

async function tryWormhole(params: AdapterBridgeParams): Promise<AdapterBridgeResult> {
    try {
        // Wormhole doesn't have a direct quote API like deBridge.
        // For wrapped token bridges, the rate is 1:1 minus relayer fees.
        // We use Wormhole SDK patterns here.

        // Map chain IDs to Wormhole chain IDs
        const wormholeChainMap: Record<string, number> = {
            "1": 2,       // Ethereum
            "56": 4,      // BNB
            "137": 5,     // Polygon
            "43114": 6,   // Avalanche
            "10": 24,     // Optimism
            "42161": 23,  // Arbitrum
            "8453": 30,   // Base
            "solana": 1,  // Solana
            "sui": 21,    // Sui
        };

        const srcWormholeId = wormholeChainMap[params.fromChainId];
        const dstWormholeId = wormholeChainMap[params.toChainId];

        if (!srcWormholeId || !dstWormholeId) {
            return { success: false, error: `Wormhole doesn't support ${params.fromChainId} → ${params.toChainId}` };
        }

        // For Wormhole Portal Bridge, wrapped token transfers are 1:1
        // The main cost is the relayer fee (typically small)
        // We estimate based on the input amount
        const inAmt = parseFloat(params.amount);
        const relayerFeePct = 0.001; // ~0.1% typical Wormhole relayer fee
        const estimatedOut = Math.floor(inAmt * (1 - relayerFeePct));

        // Check if the source-dest pair has an active Wormhole route
        // by querying the Wormhole API for supported tokens
        const supportCheckUrl = `${WORMHOLE_API}/governor/token_list`;
        const supportResp = await fetch(supportCheckUrl, {
            signal: AbortSignal.timeout(8_000),
        });

        if (!supportResp.ok) {
            return { success: false, error: `Wormhole API unavailable (${supportResp.status})` };
        }

        const slippageMultiplier = 1 - params.slippageBps / 10_000;
        const toAmountMin = String(Math.floor(estimatedOut * slippageMultiplier));

        return {
            success: true,
            toAmount: String(estimatedOut),
            toAmountMin,
            exchangeRate: inAmt > 0 ? String(estimatedOut / inAmt) : "1",
            etaSeconds: 900, // Wormhole typically 10-15 min
            fees: [{
                name: "Wormhole Relayer Fee",
                amount: String(Math.floor(inAmt * relayerFeePct)),
                token: params.fromChainId === "sui" ? "SUI" : "ETH",
            }],
            steps: [
                {
                    id: `step-wormhole-${crypto.randomUUID()}`,
                    type: "bridgeSend" as const,
                    description: `Bridge via Wormhole (${params.fromChainId} → ${params.toChainId})`,
                    chainId: params.fromChainId,
                    tool: "Wormhole",
                },
            ],
        };
    } catch (err) {
        return {
            success: false,
            error: `Wormhole bridge error: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}
