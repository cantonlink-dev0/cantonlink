// src/lib/hooks/useApproval.ts
// Hook: ERC-20 allowance checking and approval execution
"use client";

import { useState, useCallback } from "react";
import { isNativeToken } from "@/lib/adapters/evm/approvalHelper";

interface UseApprovalResult {
    needsApproval: boolean;
    approving: boolean;
    error: string | null;
    checkApproval: (
        tokenAddress: string,
        spenderAddress: string,
        amount: string
    ) => Promise<boolean>;
    reset: () => void;
}

/**
 * Hook for managing ERC-20 token approvals.
 *
 * The actual allowance read / approve write is performed by the calling
 * component using wagmi's useReadContract / useWriteContract, since those
 * hooks need React context. This hook manages the approval state machine.
 */
export function useApproval(): UseApprovalResult {
    const [needsApproval, setNeedsApproval] = useState(false);
    const [approving, setApproving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkApproval = useCallback(
        async (
            tokenAddress: string,
            _spenderAddress: string,
            _amount: string
        ): Promise<boolean> => {
            // Native tokens never need approval
            if (isNativeToken(tokenAddress)) {
                setNeedsApproval(false);
                return false;
            }

            // Approval check is done in the component via wagmi readContract
            // This just marks that we need to check
            setNeedsApproval(true);
            return true;
        },
        []
    );

    const reset = useCallback(() => {
        setNeedsApproval(false);
        setApproving(false);
        setError(null);
    }, []);

    return {
        needsApproval,
        approving,
        error,
        checkApproval,
        reset,
    };
}
