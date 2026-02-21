// src/__tests__/adapters/paraswapAdapter.test.ts
// Tests: ParaSwap adapter with mocked fetch responses (no API key needed)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { paraswapAdapter } from "@/lib/adapters/evm/paraswapAdapter";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
    mockFetch.mockReset();
});

describe("paraswapAdapter", () => {
    it("has correct adapter name", () => {
        expect(paraswapAdapter.name).toBe("ParaSwap");
    });

    it("returns a quote from ParaSwap API", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                priceRoute: {
                    srcAmount: "1000000000000000000",
                    destAmount: "2600000000",
                    gasCost: "250000",
                    gasCostUSD: "3.50",
                    srcDecimals: 18,
                    destDecimals: 6,
                },
            }),
        });

        const result = await paraswapAdapter.getQuote({
            chainId: "1",
            fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            toTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount: "1000000000000000000",
            slippageBps: 50,
        });

        expect(result.success).toBe(true);
        expect(result.toAmount).toBe("2600000000");
        expect(result.estimatedGas).toBe("250000");
    });

    it("returns transaction data when sender provided", async () => {
        // First call: /prices
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                priceRoute: {
                    srcAmount: "1000000000000000000",
                    destAmount: "2600000000",
                    gasCost: "250000",
                    srcDecimals: 18,
                    destDecimals: 6,
                },
            }),
        });
        // Second call: /transactions
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                to: "0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57",
                data: "0xabcdef123456",
                value: "1000000000000000000",
                gas: 300000,
            }),
        });

        const result = await paraswapAdapter.getQuote({
            chainId: "1",
            fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            toTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount: "1000000000000000000",
            slippageBps: 50,
            senderAddress: "0xUserWallet",
        });

        expect(result.success).toBe(true);
        expect(result.transactionData).toBeDefined();
        expect(result.transactionData?.to).toBe("0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57");
    });

    it("returns error when no route found", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({}), // No priceRoute
        });

        const result = await paraswapAdapter.getQuote({
            chainId: "1",
            fromTokenAddress: "invalid",
            toTokenAddress: "invalid",
            amount: "1",
            slippageBps: 50,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("No swap route");
    });

    it("handles API errors gracefully", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: async () => "Internal Server Error",
        });

        const result = await paraswapAdapter.getQuote({
            chainId: "1",
            fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            toTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount: "1",
            slippageBps: 50,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("500");
    });
});
