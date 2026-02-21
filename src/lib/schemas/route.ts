// src/lib/schemas/route.ts
// Zod schemas for Route and RouteStep

import { z } from "zod";

/** Types of steps in a route execution. */
export const RouteStepTypeSchema = z.enum([
    "approve",
    "swap",
    "bridgeSend",
    "bridgeReceive",
    "destinationSwap",
]);

export type RouteStepType = z.infer<typeof RouteStepTypeSchema>;

/** A single step in the route execution plan. */
export const RouteStepSchema = z.object({
    id: z.string(),
    type: RouteStepTypeSchema,
    description: z.string(),
    chainId: z.string(),
    /** The tool or protocol used (e.g., "1inch", "Jupiter", "LI.FI/stargate"). */
    tool: z.string(),
    /** EVM: tx data. Solana: base64 transaction. */
    transactionData: z
        .object({
            to: z.string().optional(),
            data: z.string().optional(),
            value: z.string().optional(),
            gasLimit: z.string().optional(),
            /** Solana: base64-encoded serialized transaction */
            serializedTransaction: z.string().optional(),
        })
        .optional(),
    /** Status of this step's execution. */
    status: z
        .enum(["pending", "executing", "completed", "failed", "skipped"])
        .default("pending"),
    txHash: z.string().optional(),
    error: z.string().optional(),
});

export type RouteStep = z.infer<typeof RouteStepSchema>;

/** Full route object. */
export const RouteSchema = z.object({
    routeId: z.string(),
    mode: z.enum(["AUTO", "SWAP_ONLY", "BRIDGE_ONLY"]),
    routeType: z.enum(["swap", "bridge", "bridge+swap"]),
    provider: z.string(),
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
    steps: z.array(RouteStepSchema),
    fees: z
        .array(
            z.object({
                name: z.string(),
                amount: z.string(),
                token: z.string(),
                amountUsd: z.number().optional(),
            })
        )
        .default([]),
    etaSeconds: z.number().optional(),
    estimatedGas: z.string().optional(),
    exchangeRate: z.string().optional(),
    priceImpact: z.number().optional(),
    routeReason: z.string().optional(),
    createdAt: z.number(),
});

export type Route = z.infer<typeof RouteSchema>;

/** Structured routing error. */
export const RoutingErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
});

export type RoutingError = z.infer<typeof RoutingErrorSchema>;
