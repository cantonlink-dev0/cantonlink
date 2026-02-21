// src/__tests__/integration/quoteFlow.test.ts
// Integration test: end-to-end quote → route flow with mocked API responses

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    resolveRoute,
    registerEvmSwapAdapter,
    registerSolanaSwapAdapter,
    registerBridgeAdapter,
} from "@/lib/routing/routingEngine";
import { paraswapAdapter } from "@/lib/adapters/evm/paraswapAdapter";
import { jupiterAdapter } from "@/lib/adapters/solana/jupiterAdapter";
import { lifiAdapter } from "@/lib/adapters/bridge/lifiAdapter";

// Mock fetch globally for all adapter API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

/**
 * Helper: configure mockFetch to return a ParaSwap-like response
 */
function mockParaswapQuote() {
    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            priceRoute: {
                srcAmount: "1000000000000000000",
                destAmount: "2600000000",
                gasCost: "250000",
                gasCostUSD: "2.50",
                srcDecimals: 18,
                destDecimals: 6,
            },
        }),
    });
}

/**
 * Helper: configure mockFetch to return a Jupiter-like response
 */
function mockJupiterQuote() {
    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            inAmount: "1000000000",
            outAmount: "175000000",
            otherAmountThreshold: "173250000",
            priceImpactPct: "0.12",
        }),
    });
}

/**
 * Helper: configure mockFetch to return a LI.FI-like bridge response
 */
function mockLifiBridgeRoute() {
    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
            routes: [{
                id: "route-integration-test",
                fromAmount: "1000000",
                toAmount: "995000",
                toAmountMin: "990000",
                gasCostUSD: "2.50",
                steps: [{
                    id: "step-bridge",
                    type: "lifi",
                    tool: "stargate",
                    action: {
                        fromChainId: 1,
                        toChainId: 42161,
                        fromToken: { symbol: "USDC" },
                        toToken: { symbol: "USDC" },
                    },
                    estimate: {
                        executionDuration: 300,
                        approvalAddress: "0xApproval",
                    },
                    includedSteps: [
                        {
                            id: "sub-cross",
                            type: "cross",
                            tool: "stargate",
                            action: {
                                fromChainId: 1,
                                toChainId: 42161,
                            },
                        },
                    ],
                }],
            }],
        }),
    });
}

beforeEach(() => {
    mockFetch.mockReset();
    registerEvmSwapAdapter(paraswapAdapter);
    registerSolanaSwapAdapter(jupiterAdapter);
    registerBridgeAdapter(lifiAdapter);
});

describe("Integration: Quote Flow", () => {
    it("EVM same-chain swap: ETH → USDC on Ethereum", async () => {
        mockParaswapQuote();

        const result = await resolveRoute({
            fromChainId: "1",
            toChainId: "1",
            fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            toTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount: "1000000000000000000",
            slippageBps: 50,
            mode: "AUTO",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.route.routeType).toBe("swap");
            expect(result.route.provider).toBe("ParaSwap");
            expect(result.route.fromChainId).toBe("1");
            expect(result.route.toAmount).toBeDefined();
            expect(result.route.steps.find((s) => s.type === "swap")).toBeDefined();
        }
    });

    it("EVM cross-chain bridge: USDC Ethereum → Arbitrum", async () => {
        mockLifiBridgeRoute();

        const result = await resolveRoute({
            fromChainId: "1",
            toChainId: "42161",
            fromTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            toTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            amount: "1000000",
            slippageBps: 50,
            mode: "AUTO",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.route.routeType).toBe("bridge");
            expect(result.route.provider).toBe("LI.FI");
            expect(result.route.etaSeconds).toBeGreaterThan(0);
            expect(result.route.steps.length).toBeGreaterThanOrEqual(2);
            expect(result.route.steps.find((s) => s.type === "bridgeSend")).toBeDefined();
            expect(result.route.steps.find((s) => s.type === "bridgeReceive")).toBeDefined();
        }
    });

    it("Solana swap: SOL → USDC", async () => {
        mockJupiterQuote();

        const result = await resolveRoute({
            fromChainId: "solana",
            toChainId: "solana",
            fromTokenAddress: "So11111111111111111111111111111111111111112",
            toTokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            amount: "1000000000",
            slippageBps: 50,
            mode: "AUTO",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.route.routeType).toBe("swap");
            expect(result.route.provider).toBe("Jupiter");
            expect(result.route.toAmount).toBeDefined();
        }
    });

    it("SWAP_ONLY mode with ERC-20: includes approval step", async () => {
        mockParaswapQuote();

        const result = await resolveRoute({
            fromChainId: "1",
            toChainId: "1",
            fromTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            toTokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            amount: "1000000",
            slippageBps: 50,
            mode: "SWAP_ONLY",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            const approveStep = result.route.steps.find((s) => s.type === "approve");
            expect(approveStep).toBeDefined();
        }
    });

    it("BRIDGE_ONLY mode: returns bridge route", async () => {
        mockLifiBridgeRoute();

        const result = await resolveRoute({
            fromChainId: "1",
            toChainId: "42161",
            fromTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            toTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            amount: "1000000",
            slippageBps: 50,
            mode: "BRIDGE_ONLY",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.route.mode).toBe("BRIDGE_ONLY");
            expect(result.route.routeReason).toContain("Bridge-only");
        }
    });

    it("route includes createdAt timestamp", async () => {
        mockParaswapQuote();
        const before = Date.now();

        const result = await resolveRoute({
            fromChainId: "1",
            toChainId: "1",
            fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            toTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount: "1",
            slippageBps: 50,
            mode: "AUTO",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.route.createdAt).toBeGreaterThanOrEqual(before);
            expect(result.route.routeId).toBeDefined();
        }
    });
});
