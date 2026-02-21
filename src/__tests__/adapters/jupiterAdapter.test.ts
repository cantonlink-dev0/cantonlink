// src/__tests__/adapters/jupiterAdapter.test.ts
// Tests: Jupiter adapter with mocked fetch responses

import { describe, it, expect, vi, beforeEach } from "vitest";
import { jupiterAdapter } from "@/lib/adapters/solana/jupiterAdapter";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
    mockFetch.mockReset();
});

describe("jupiterAdapter", () => {
    it("has correct adapter name", () => {
        expect(jupiterAdapter.name).toBe("Jupiter");
    });

    it("returns a swap quote from Jupiter API", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                inputMint: "So11111111111111111111111111111111111111112",
                outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                inAmount: "1000000000",
                outAmount: "175000000",
                otherAmountThreshold: "173250000",
                priceImpactPct: "0.12",
                routePlan: [],
            }),
        });

        const result = await jupiterAdapter.getQuote({
            chainId: "solana",
            fromTokenAddress: "So11111111111111111111111111111111111111112",
            toTokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            amount: "1000000000",
            slippageBps: 50,
        });

        expect(result.success).toBe(true);
        expect(result.toAmount).toBe("175000000");
        expect(result.toAmountMin).toBe("173250000");
    });

    it("returns serialized transaction when sender provided", async () => {
        // First call: /quote
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                inAmount: "1000000000",
                outAmount: "175000000",
                otherAmountThreshold: "173250000",
                priceImpactPct: "0.12",
            }),
        });
        // Second call: /swap
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                swapTransaction: "base64EncodedTransaction==",
            }),
        });

        const result = await jupiterAdapter.getQuote({
            chainId: "solana",
            fromTokenAddress: "So11111111111111111111111111111111111111112",
            toTokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            amount: "1000000000",
            slippageBps: 50,
            senderAddress: "SolanaWalletPubkey",
        });

        expect(result.success).toBe(true);
        expect(result.transactionData?.serializedTransaction).toBe("base64EncodedTransaction==");
    });

    it("returns price impact", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                inAmount: "1000000000",
                outAmount: "175000000",
                otherAmountThreshold: "173250000",
                priceImpactPct: "0.42",
            }),
        });

        const result = await jupiterAdapter.getQuote({
            chainId: "solana",
            fromTokenAddress: "So11111111111111111111111111111111111111112",
            toTokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            amount: "1000000000",
            slippageBps: 50,
        });

        expect(result.priceImpact).toBe(0.42);
    });

    it("handles API errors gracefully", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: async () => "Invalid token pair",
        });

        const result = await jupiterAdapter.getQuote({
            chainId: "solana",
            fromTokenAddress: "invalid",
            toTokenAddress: "invalid",
            amount: "1",
            slippageBps: 50,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("400");
    });
});
