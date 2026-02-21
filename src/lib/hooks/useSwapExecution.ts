// src/lib/hooks/useSwapExecution.ts
// Hook: manages the swap transaction lifecycle (EVM or Solana)
"use client";

import { useState, useCallback } from "react";
import type { StatusState } from "@/lib/utils/constants";
import type { Route } from "@/lib/schemas/route";

interface UseSwapExecutionResult {
    status: StatusState;
    txHash: string | null;
    error: string | null;
    executeSwap: (route: Route) => Promise<void>;
    reset: () => void;
}

/**
 * Manages swap transaction execution.
 *
 * For EVM: uses wagmi's sendTransaction/writeContract from the calling component.
 * For Solana: uses the wallet adapter's signTransaction.
 *
 * This hook primarily manages status state. The actual signing is done
 * by passing callbacks from the wallet hooks.
 */
export function useSwapExecution(): UseSwapExecutionResult {
    const [status, setStatus] = useState<StatusState>("IDLE");
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const executeSwap = useCallback(async (route: Route) => {
        setError(null);
        setTxHash(null);

        try {
            // Find the swap step
            const swapStep = route.steps.find((s) => s.type === "swap");
            if (!swapStep) {
                throw new Error("No swap step found in route");
            }

            // Check for approval step
            const approvalStep = route.steps.find((s) => s.type === "approve");
            if (approvalStep) {
                setStatus("APPROVAL_REQUIRED");
                // Approval is handled by the UI component using useApproval hook
                // The component will call back when approval is complete
                return;
            }

            setStatus("EXECUTING");

            // Transaction signing is handled by the UI component
            // This hook manages the status flow
        } catch (err) {
            setStatus("FAILED");
            setError(err instanceof Error ? err.message : "Swap execution failed");
        }
    }, []);

    const reset = useCallback(() => {
        setStatus("IDLE");
        setTxHash(null);
        setError(null);
    }, []);

    return {
        status,
        txHash,
        error,
        executeSwap,
        reset,
    };
}
