// src/__tests__/adapters/lifiAdapter.test.ts
// Tests: LI.FI adapter — real API integration (no mock mode)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { lifiAdapter, getLifiBridgeStatus } from "@/lib/adapters/bridge/lifiAdapter";

// Mock fetch to avoid actual API calls in tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
    mockFetch.mockReset();
});

describe("lifiAdapter", () => {
    it("has correct adapter name", () => {
        expect(lifiAdapter.name).toBe("LI.FI");
    });

    it("returns bridge route from API", async () => {
        // Mock LI.FI /advanced/routes response
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                routes: [{
                    id: "route-123",
                    fromAmount: "1000000",
                    toAmount: "995000",
                    toAmountMin: "990000",
                    gasCostUSD: "2.50",
                    steps: [{
                        id: "step-1",
                        type: "lifi",
                        tool: "stargate",
                        action: {
                            fromChainId: 1,
                            toChainId: 42161,
                            fromToken: { symbol: "USDC" },
                            toToken: { symbol: "USDC" },
                        },
                        estimate: {
                            executionDuration: 180,
                            approvalAddress: "0xApproval",
                        },
                        includedSteps: [
                            {
                                id: "sub-1",
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

        const result = await lifiAdapter.getRoute({
            fromChainId: "1",
            toChainId: "42161",
            fromTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            toTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            amount: "1000000",
            slippageBps: 50,
        });

        expect(result.success).toBe(true);
        expect(result.toAmount).toBe("995000");
        expect(result.providerRouteId).toBe("route-123");
        expect(result.steps).toBeDefined();
        expect(result.steps!.length).toBeGreaterThanOrEqual(2);
    });

    it("returns error when no routes found", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ routes: [] }),
        });

        const result = await lifiAdapter.getRoute({
            fromChainId: "1",
            toChainId: "42161",
            fromTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            toTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            amount: "1000000",
            slippageBps: 50,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("No bridge routes found");
    });

    it("handles API errors gracefully", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error",
        });

        const result = await lifiAdapter.getRoute({
            fromChainId: "1",
            toChainId: "42161",
            fromTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            toTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            amount: "1000000",
            slippageBps: 50,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("500");
    });
});

describe("getLifiBridgeStatus", () => {
    it("maps DONE status to COMPLETED", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "DONE",
                receiving: { txHash: "0xReceiveTx" },
                sending: { txHash: "0xSendTx" },
                lifiExplorerLink: "https://explorer.li.fi/tx/123",
            }),
        });

        const status = await getLifiBridgeStatus("0xTestHash", "1", "42161");
        expect(status.status).toBe("COMPLETED");
        expect(status.toTxHash).toBe("0xReceiveTx");
    });

    it("maps PENDING status to BRIDGING", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                status: "PENDING",
                sending: { txHash: "0xSendTx" },
            }),
        });

        const status = await getLifiBridgeStatus("0xTestHash", "1", "42161");
        expect(status.status).toBe("BRIDGING");
        expect(status.fromTxHash).toBe("0xSendTx");
    });
});
