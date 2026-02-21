// src/__tests__/routing/routingEngine.test.ts
// Tests: routing engine delegates correctly based on mode and chains

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    resolveRoute,
    registerEvmSwapAdapter,
    registerSolanaSwapAdapter,
    registerBridgeAdapter,
    type SwapAdapter,
    type BridgeAdapter,
} from "@/lib/routing/routingEngine";

// Mock adapters
const mockEvmAdapter: SwapAdapter = {
    name: "MockEvmSwap",
    getQuote: vi.fn().mockResolvedValue({
        success: true,
        toAmount: "2500000000",
        toAmountMin: "2487500000",
        exchangeRate: "2500",
        priceImpact: 0.1,
        transactionData: { to: "0xRouter", data: "0xswap", value: "0" },
    }),
};

const mockSolanaAdapter: SwapAdapter = {
    name: "MockSolanaSwap",
    getQuote: vi.fn().mockResolvedValue({
        success: true,
        toAmount: "150000000",
        toAmountMin: "149250000",
        exchangeRate: "150",
        transactionData: { serializedTransaction: "base64tx" },
    }),
};

const mockBridgeAdapter: BridgeAdapter = {
    name: "MockBridge",
    getRoute: vi.fn().mockResolvedValue({
        success: true,
        toAmount: "997000",
        toAmountMin: "992015",
        etaSeconds: 180,
        steps: [
            {
                id: "step1",
                type: "bridgeSend",
                description: "Send via bridge",
                chainId: "1",
                tool: "MockBridge",
            },
            {
                id: "step2",
                type: "bridgeReceive",
                description: "Receive on destination",
                chainId: "42161",
                tool: "MockBridge",
            },
        ],
    }),
};

beforeEach(() => {
    registerEvmSwapAdapter(mockEvmAdapter);
    registerSolanaSwapAdapter(mockSolanaAdapter);
    registerBridgeAdapter(mockBridgeAdapter);
    vi.clearAllMocks();
});

describe("routingEngine", () => {
    it("AUTO same-chain routes to EVM swap adapter", async () => {
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
            expect(result.route.provider).toBe("MockEvmSwap");
            expect(result.route.routeReason).toContain("Same chain");
        }
        expect(mockEvmAdapter.getQuote).toHaveBeenCalledOnce();
        expect(mockBridgeAdapter.getRoute).not.toHaveBeenCalled();
    });

    it("AUTO cross-chain routes to bridge adapter", async () => {
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
            expect(result.route.provider).toBe("MockBridge");
            expect(result.route.routeReason).toContain("Cross-chain");
            expect(result.route.etaSeconds).toBe(180);
        }
        expect(mockBridgeAdapter.getRoute).toHaveBeenCalledOnce();
    });

    it("AUTO Solana same-chain routes to Jupiter adapter", async () => {
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
            expect(result.route.provider).toBe("MockSolanaSwap");
        }
        expect(mockSolanaAdapter.getQuote).toHaveBeenCalledOnce();
    });

    it("SWAP_ONLY blocks cross-chain", async () => {
        const result = await resolveRoute({
            fromChainId: "1",
            toChainId: "42161",
            fromTokenAddress: "0xA",
            toTokenAddress: "0xB",
            amount: "1000",
            slippageBps: 50,
            mode: "SWAP_ONLY",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("MODE_SWAP_CROSS_CHAIN");
        }
    });

    it("BRIDGE_ONLY blocks same-chain", async () => {
        const result = await resolveRoute({
            fromChainId: "1",
            toChainId: "1",
            fromTokenAddress: "0xA",
            toTokenAddress: "0xB",
            amount: "1000",
            slippageBps: 50,
            mode: "BRIDGE_ONLY",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("MODE_BRIDGE_SAME_CHAIN");
        }
    });

    it("rejects invalid chain", async () => {
        const result = await resolveRoute({
            fromChainId: "99999",
            toChainId: "1",
            fromTokenAddress: "0xA",
            toTokenAddress: "0xB",
            amount: "1000",
            slippageBps: 50,
            mode: "AUTO",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe("INVALID_FROM_CHAIN");
        }
    });

    it("EVM swap includes approval step for ERC-20 (non-native)", async () => {
        const result = await resolveRoute({
            fromChainId: "1",
            toChainId: "1",
            fromTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
            toTokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
            amount: "1000000",
            slippageBps: 50,
            mode: "AUTO",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            const approveStep = result.route.steps.find((s) => s.type === "approve");
            expect(approveStep).toBeDefined();
            expect(result.route.steps.length).toBeGreaterThanOrEqual(2);
        }
    });

    it("EVM swap skips approval for native ETH", async () => {
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
            const approveStep = result.route.steps.find((s) => s.type === "approve");
            expect(approveStep).toBeUndefined();
        }
    });
});
