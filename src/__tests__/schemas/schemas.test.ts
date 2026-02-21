// src/__tests__/schemas/schemas.test.ts
// Tests: Zod schema validation for all API boundaries

import { describe, it, expect } from "vitest";
import { QuoteRequestSchema, QuoteResponseSchema } from "@/lib/schemas/quote";
import { RouteSchema, RoutingErrorSchema, RouteStepSchema } from "@/lib/schemas/route";
import { EvmTxRequestSchema, SolanaTxRequestSchema, ApprovalCheckSchema } from "@/lib/schemas/transaction";
import { StatusResponseSchema, PersistedRouteSchema } from "@/lib/schemas/status";

describe("QuoteRequestSchema", () => {
    it("validates a correct quote request", () => {
        const result = QuoteRequestSchema.safeParse({
            fromChainId: "1",
            toChainId: "42161",
            fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
            toTokenAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            amount: "1000000000000000000",
            slippageBps: 50,
            mode: "AUTO",
        });
        expect(result.success).toBe(true);
    });

    it("rejects empty amount", () => {
        const result = QuoteRequestSchema.safeParse({
            fromChainId: "1",
            toChainId: "42161",
            fromTokenAddress: "0xA",
            toTokenAddress: "0xB",
            amount: "",
        });
        expect(result.success).toBe(false);
    });

    it("rejects invalid mode", () => {
        const result = QuoteRequestSchema.safeParse({
            fromChainId: "1",
            toChainId: "42161",
            fromTokenAddress: "0xA",
            toTokenAddress: "0xB",
            amount: "100",
            mode: "INVALID_MODE",
        });
        expect(result.success).toBe(false);
    });

    it("applies default slippage", () => {
        const result = QuoteRequestSchema.parse({
            fromChainId: "1",
            toChainId: "1",
            fromTokenAddress: "0xA",
            toTokenAddress: "0xB",
            amount: "100",
        });
        expect(result.slippageBps).toBe(50);
        expect(result.mode).toBe("AUTO");
    });
});

describe("RouteStepSchema", () => {
    it("validates a swap step", () => {
        const result = RouteStepSchema.safeParse({
            id: "step-1",
            type: "swap",
            description: "Swap via 1inch",
            chainId: "1",
            tool: "1inch",
            status: "pending",
        });
        expect(result.success).toBe(true);
    });

    it("rejects invalid step type", () => {
        const result = RouteStepSchema.safeParse({
            id: "step-1",
            type: "invalid_type",
            description: "Bad step",
            chainId: "1",
            tool: "test",
        });
        expect(result.success).toBe(false);
    });
});

describe("RoutingErrorSchema", () => {
    it("validates a routing error", () => {
        const result = RoutingErrorSchema.safeParse({
            code: "MODE_SWAP_CROSS_CHAIN",
            message: "Swap-only mode requires the same chain on both sides.",
        });
        expect(result.success).toBe(true);
    });
});

describe("EvmTxRequestSchema", () => {
    it("validates an EVM tx request", () => {
        const result = EvmTxRequestSchema.safeParse({
            to: "0x1111111254EEB25477B68fb85Ed929f73A960582",
            data: "0xswapdata",
            value: "0",
            chainId: 1,
        });
        expect(result.success).toBe(true);
    });
});

describe("SolanaTxRequestSchema", () => {
    it("validates a Solana tx request", () => {
        const result = SolanaTxRequestSchema.safeParse({
            serializedTransaction: "base64encodedtx",
        });
        expect(result.success).toBe(true);
    });
});

describe("StatusResponseSchema", () => {
    it("validates a status response", () => {
        const result = StatusResponseSchema.safeParse({
            routeId: "route-123",
            status: "BRIDGING",
            fromTxHash: "0xabc",
            stepStatuses: [],
            updatedAt: Date.now(),
        });
        expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
        const result = StatusResponseSchema.safeParse({
            routeId: "route-123",
            status: "INVALID",
            updatedAt: Date.now(),
        });
        expect(result.success).toBe(false);
    });
});

describe("PersistedRouteSchema", () => {
    it("validates a persisted route", () => {
        const result = PersistedRouteSchema.safeParse({
            routeId: "route-123",
            provider: "LI.FI",
            status: "BRIDGING",
            fromChainId: "1",
            toChainId: "42161",
            fromToken: "0xA",
            toToken: "0xB",
            fromAmount: "1000",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        expect(result.success).toBe(true);
    });
});
