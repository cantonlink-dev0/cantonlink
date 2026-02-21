// src/lib/routing/modeEnforcement.ts
// Mode rules: validates from/to chain + token selections against the active mode.

import type { RoutingError } from "@/lib/schemas/route";
import type { Mode } from "@/lib/utils/constants";

export interface ModeValidationInput {
    mode: Mode;
    fromChainId: string;
    toChainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
}

export interface ModeValidationResult {
    valid: boolean;
    error?: RoutingError;
}

/**
 * Enforce mode rules before requesting a quote.
 *
 * - SWAP_ONLY: same chain required.
 * - BRIDGE_ONLY: different chains required.
 *   If same token → allowed. If different token → allowed only if provider
 *   supports swap-on-route (caller must check this separately; we flag it here).
 * - AUTO: always passes pre-validation.
 */
export function validateMode(input: ModeValidationInput): ModeValidationResult {
    const { mode, fromChainId, toChainId } = input;
    const sameChain = fromChainId === toChainId;

    if (mode === "SWAP_ONLY" && !sameChain) {
        return {
            valid: false,
            error: {
                code: "MODE_SWAP_CROSS_CHAIN",
                message:
                    "Swap-only mode requires the same chain on both sides.",
            },
        };
    }

    if (mode === "BRIDGE_ONLY" && sameChain) {
        return {
            valid: false,
            error: {
                code: "MODE_BRIDGE_SAME_CHAIN",
                message:
                    "Bridge-only mode requires different chains.",
            },
        };
    }

    return { valid: true };
}

/**
 * Determine the route type based on AUTO mode logic.
 */
export function resolveAutoRouteType(
    fromChainId: string,
    toChainId: string
): { routeType: "swap" | "bridge"; reason: string } {
    if (fromChainId === toChainId) {
        return {
            routeType: "swap",
            reason: `Same chain (${fromChainId}) — using swap adapter.`,
        };
    }
    return {
        routeType: "bridge",
        reason: `Cross-chain (${fromChainId} → ${toChainId}) — using bridge adapter.`,
    };
}
