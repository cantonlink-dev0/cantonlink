// src/lib/adapters/bridge/deBridgeAdapter.ts
//
// deBridge DLN (Decentralized Liquidity Network) Adapter
// ────────────────────────────────────────────────────────
// NO API KEY REQUIRED — completely free to use.
// Base URL: https://dln.debridge.finance/v1.0
//
// Supports EVM ↔ EVM cross-chain swaps for:
//   USDC, ETH, WETH, and most major tokens
//   Across: Ethereum, Arbitrum, Optimism, Base, Polygon, BNB, Avalanche, Solana + 20 more
//
// Fee structure (on-chain, transparent):
//   - Flat fee: ~0.001 ETH gas equivalent on source chain
//   - Variable: 0.04% (4bps) of input amount
//   - These are auto-included in the API response
//
// API verified live: 2026-02-18 (no key, instant response)

import type { BridgeAdapter, AdapterBridgeParams, AdapterBridgeResult } from "@/lib/routing/routingEngine";

const DEBRIDGE_API = "https://dln.debridge.finance/v1.0";

// deBridge chain IDs (not all EVM — deBridge has its own chain IDs for non-EVM chains)
// These map from our internal chain IDs to deBridge's expected srcChainId values
const DEBRIDGE_CHAIN_IDS: Record<string, string> = {
    "1": "1",           // Ethereum mainnet
    "42161": "42161",   // Arbitrum
    "10": "10",         // Optimism
    "8453": "8453",     // Base
    "137": "137",       // Polygon
    "56": "56",         // BNB Chain
    "43114": "43114",   // Avalanche
    "100": "100",       // Gnosis
    "59144": "59144",   // Linea
    "11155111": "11155111", // Sepolia testnet
};

// USDC addresses per chain (official Circle)
const USDC_BY_CHAIN: Record<string, string> = {
    "1": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "42161": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "10": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "137": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    "56": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    "43114": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    "100": "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
    "11155111": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
};

interface DeBridgeEstimation {
    srcChainTokenIn: {
        amount: string;
        approximateUsdValue: number;
        decimals: number;
        symbol: string;
    };
    dstChainTokenOut: {
        amount: string;
        recommendedAmount: string;
        approximateUsdValue: number;
        decimals: number;
        symbol: string;
    };
    costsDetails: Array<{
        type: string;
        payload: { feeAmount: string; feeApproximateUsdValue?: string };
    }>;
}

interface DeBridgeQuoteResponse {
    estimation: DeBridgeEstimation;
    tx?: {
        allowanceTarget: string;
        allowanceValue: string;
        data?: string;
        to?: string;
        value?: string;
    };
    order?: { approximateFulfillmentDelay: number };
    fixFee?: string;
    protocolFee?: string;
}

/**
 * Fetch a quote + transaction from deBridge DLN (no API key required).
 */
async function deBridgeQuote(
    srcChainId: string,
    srcToken: string,
    srcAmount: string,
    dstChainId: string,
    dstToken: string,
    recipientAddress: string,
): Promise<DeBridgeQuoteResponse> {
    const url = new URL(`${DEBRIDGE_API}/dln/order/create-tx`);
    url.searchParams.set("srcChainId", srcChainId);
    url.searchParams.set("srcChainTokenIn", srcToken);
    url.searchParams.set("srcChainTokenInAmount", srcAmount);
    url.searchParams.set("dstChainId", dstChainId);
    url.searchParams.set("dstChainTokenOut", dstToken);
    url.searchParams.set("dstChainTokenOutRecipient", recipientAddress || "0x0000000000000000000000000000000000000001");
    url.searchParams.set("prependOperatingExpenses", "true");

    const res = await fetch(url.toString(), {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`deBridge API error ${res.status}: ${errText}`);
    }

    return res.json() as Promise<DeBridgeQuoteResponse>;
}

/**
 * deBridge DLN bridge adapter — free, no API key required.
 *
 * Handles EVM ↔ EVM cross-chain swaps using deBridge's Decentralized Liquidity Network.
 * Returns real transaction data (allowance target, calldata) for immediate execution.
 *
 * Use this for:
 *   - Swapping USDC from any EVM chain to ETH mainnet before bridging to Canton via xReserve
 *   - General EVM ↔ EVM cross-chain swaps in the app
 */
export const deBridgeAdapter: BridgeAdapter = {
    name: "deBridge DLN",

    async getRoute(params: AdapterBridgeParams): Promise<AdapterBridgeResult> {
        try {
            const { fromChainId, toChainId, fromTokenAddress, toTokenAddress, amount, senderAddress, recipientAddress } = params;

            // Validate both chains are EVM chains supported by deBridge
            const srcChainId = DEBRIDGE_CHAIN_IDS[fromChainId];
            const dstChainId = DEBRIDGE_CHAIN_IDS[toChainId];

            if (!srcChainId) {
                return {
                    success: false,
                    error: `deBridge does not support source chain ${fromChainId}. Supported: ${Object.keys(DEBRIDGE_CHAIN_IDS).join(", ")}`,
                };
            }

            if (!dstChainId) {
                return {
                    success: false,
                    error: `deBridge does not support destination chain ${toChainId}. Supported: ${Object.keys(DEBRIDGE_CHAIN_IDS).join(", ")}`,
                };
            }

            const fromAmountFloat = parseFloat(amount);
            if (isNaN(fromAmountFloat) || fromAmountFloat <= 0) {
                return { success: false, error: "Invalid amount" };
            }

            // Convert amount to raw units (assume 6 decimals for USDC, 18 for ETH)
            // Check if the source token is USDC (6 decimals) or ETH/WETH (18 decimals)
            const isUsdc = Object.values(USDC_BY_CHAIN).some(
                addr => addr.toLowerCase() === fromTokenAddress.toLowerCase()
            );
            const decimals = isUsdc ? 6 : 18;
            const rawAmount = Math.floor(fromAmountFloat * Math.pow(10, decimals)).toString();

            const recipient = recipientAddress || senderAddress || "0x0000000000000000000000000000000000000001";

            // Call deBridge API (free, no key)
            const quote = await deBridgeQuote(srcChainId, fromTokenAddress, rawAmount, dstChainId, toTokenAddress, recipient);

            const estimation = quote.estimation;
            const dstOut = estimation.dstChainTokenOut;
            const dstDecimals = dstOut.decimals ?? 6;
            const toAmountRaw = dstOut.recommendedAmount || dstOut.amount;
            const toAmountFloat = Number(toAmountRaw) / Math.pow(10, dstDecimals);
            const toAmount = toAmountFloat.toFixed(dstDecimals > 6 ? 8 : 6);
            const toAmountMin = (toAmountFloat * 0.995).toFixed(dstDecimals > 6 ? 8 : 6); // 0.5% slippage

            // Extract fees from costsDetails
            const totalFeeUsd = estimation.costsDetails.reduce((acc, cost) => {
                const feeUsd = parseFloat(cost.payload.feeApproximateUsdValue || "0");
                return acc + feeUsd;
            }, 0);

            const protocolFeeBps = 4; // deBridge charges 4bps
            const bridgeFeeUsd = estimation.srcChainTokenIn.approximateUsdValue * 0.0004;

            // Build steps
            const steps: AdapterBridgeResult["steps"] = [];

            // Step 1: Approve (if ERC-20, i.e. not native ETH)
            const isNativeToken = fromTokenAddress === "0x0000000000000000000000000000000000000000"
                || fromTokenAddress.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

            if (!isNativeToken && quote.tx?.allowanceTarget) {
                steps.push({
                    id: `debridge-approve-${Date.now()}`,
                    type: "approve",
                    description: `Approve ${estimation.srcChainTokenIn.symbol} for deBridge DLN`,
                    chainId: fromChainId,
                    tool: "deBridge DLN",
                    transactionData: {
                        to: fromTokenAddress,          // ERC-20 contract
                        data: "0x", // execution hook builds real approve calldata
                        value: "0",
                        serializedTransaction: JSON.stringify({
                            type: "erc20:approve",
                            token: fromTokenAddress,
                            spender: quote.tx.allowanceTarget,
                            amount: rawAmount,
                        }),
                    },
                });
            }

            // Step 2: Bridge send (the actual DLN order)
            steps.push({
                id: `debridge-send-${Date.now()}`,
                type: "bridgeSend",
                description: `deBridge: ${estimation.srcChainTokenIn.symbol} on chain ${fromChainId} → ${dstOut.symbol} on chain ${toChainId} (~${(quote.order?.approximateFulfillmentDelay ?? 1)} min)`,
                chainId: fromChainId,
                tool: "deBridge DLN",
                transactionData: quote.tx ? {
                    to: quote.tx.to || "",
                    data: quote.tx.data || "0x",
                    value: quote.tx.value || "0",
                    serializedTransaction: JSON.stringify({
                        type: "debridge:dlnOrder",
                        srcChainId,
                        dstChainId,
                        srcToken: fromTokenAddress,
                        dstToken: toTokenAddress,
                        srcAmount: rawAmount,
                        dstAmount: toAmountRaw,
                        recipient,
                        allowanceTarget: quote.tx.allowanceTarget,
                        allowanceValue: quote.tx.allowanceValue,
                    }),
                } : undefined,
            });

            // Step 3: Receive (auto, handled by deBridge solvers on destination)
            steps.push({
                id: `debridge-receive-${Date.now()}`,
                type: "bridgeReceive",
                description: `Receive ${dstOut.symbol} on chain ${toChainId} (deBridge solver fulfills ~${(quote.order?.approximateFulfillmentDelay ?? 1)} min)`,
                chainId: toChainId,
                tool: "deBridge DLN",
            });

            const etaMinutes = quote.order?.approximateFulfillmentDelay ?? 1;

            return {
                success: true,
                toAmount,
                toAmountMin,
                etaSeconds: etaMinutes * 60,
                fees: [
                    {
                        name: "deBridge protocol fee (0.04%)",
                        amount: (bridgeFeeUsd).toFixed(4),
                        token: estimation.srcChainTokenIn.symbol,
                        amountUsd: bridgeFeeUsd,
                    },
                    {
                        name: "Gas + solver expenses",
                        amount: "",
                        token: "ETH",
                        amountUsd: totalFeeUsd - bridgeFeeUsd,
                    },
                ],
                steps,
                providerRouteId: `debridge-${fromChainId}-${toChainId}-${Date.now()}`,
            };

        } catch (err) {
            return {
                success: false,
                error: `deBridge adapter error: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
    },
};

export function registerDeBridgeAdapter() {
    // Nothing to register here — this is used directly by the routing engine
    // when EVM ↔ EVM bridging is needed
}
