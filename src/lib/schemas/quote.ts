// src/lib/schemas/quote.ts
// Zod schemas for quote request and response boundaries

import { z } from "zod";

/** Quote request from the frontend. */
export const QuoteRequestSchema = z.object({
    fromChainId: z.string(),
    toChainId: z.string(),
    fromTokenAddress: z.string(),
    toTokenAddress: z.string(),
    amount: z.string().min(1, "Amount is required"),
    slippageBps: z.number().int().min(1).max(5000).default(50),
    senderAddress: z.string().optional(),
    recipientAddress: z.string().optional(),
    mode: z.enum(["AUTO", "SWAP_ONLY", "BRIDGE_ONLY"]).default("AUTO"),
});

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

/** Individual fee information. */
export const FeeInfoSchema = z.object({
    name: z.string(),
    amount: z.string(),
    token: z.string(),
    amountUsd: z.number().optional(),
});

export type FeeInfo = z.infer<typeof FeeInfoSchema>;

/** Quote response returned to the frontend. */
export const QuoteResponseSchema = z.object({
    routeId: z.string(),
    provider: z.string(),
    mode: z.enum(["AUTO", "SWAP_ONLY", "BRIDGE_ONLY"]),
    routeType: z.enum(["swap", "bridge", "bridge+swap"]),
    fromChainId: z.string(),
    toChainId: z.string(),
    fromToken: z.object({
        address: z.string(),
        symbol: z.string(),
        decimals: z.number(),
    }),
    toToken: z.object({
        address: z.string(),
        symbol: z.string(),
        decimals: z.number(),
    }),
    fromAmount: z.string(),
    toAmount: z.string(),
    toAmountMin: z.string(),
    exchangeRate: z.string(),
    priceImpact: z.number().optional(),
    fees: z.array(FeeInfoSchema),
    estimatedGas: z.string().optional(),
    etaSeconds: z.number().optional(),
    routeReason: z.string().optional(),
});

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
