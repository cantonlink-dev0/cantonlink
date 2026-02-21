// src/lib/schemas/status.ts
// Zod schemas for transaction/route status tracking

import { z } from "zod";

/** All possible status states for the UI stepper. */
export const StatusStateSchema = z.enum([
    "IDLE",
    "QUOTED",
    "APPROVAL_REQUIRED",
    "APPROVING",
    "EXECUTING",
    "BRIDGING",
    "COMPLETED",
    "FAILED",
]);

export type StatusState = z.infer<typeof StatusStateSchema>;

/** Status response from the bridge provider or internal tracking. */
export const StatusResponseSchema = z.object({
    routeId: z.string(),
    status: StatusStateSchema,
    substatus: z.string().optional(),
    fromTxHash: z.string().optional(),
    toTxHash: z.string().optional(),
    bridgeTxLink: z.string().optional(),
    /** Provider-specific step statuses. */
    stepStatuses: z
        .array(
            z.object({
                stepId: z.string(),
                status: z.enum(["pending", "executing", "completed", "failed"]),
                txHash: z.string().optional(),
                message: z.string().optional(),
            })
        )
        .default([]),
    error: z.string().optional(),
    updatedAt: z.number(),
});

export type StatusResponse = z.infer<typeof StatusResponseSchema>;

/** Persisted route state for localStorage resume. */
export const PersistedRouteSchema = z.object({
    routeId: z.string(),
    fromTxHash: z.string().optional(),
    toTxHash: z.string().optional(),
    provider: z.string(),
    providerRouteId: z.string().optional(),
    status: StatusStateSchema,
    fromChainId: z.string(),
    toChainId: z.string(),
    fromToken: z.string(),
    toToken: z.string(),
    fromAmount: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
});

export type PersistedRoute = z.infer<typeof PersistedRouteSchema>;
