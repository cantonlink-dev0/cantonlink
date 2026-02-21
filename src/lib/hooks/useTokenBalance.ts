// src/lib/hooks/useTokenBalance.ts
// Hook: fetch token balance for EVM (via wagmi) or Solana
"use client";

import { useState, useCallback } from "react";
import { isNativeToken } from "@/lib/adapters/evm/approvalHelper";

interface UseTokenBalanceResult {
    balance: string | null;
    loading: boolean;
    error: string | null;
    fetchBalance: (
        chainId: string,
        tokenAddress: string,
        walletAddress: string
    ) => Promise<void>;
}

/**
 * Generic balance hook. The actual RPC call is done by the component
 * using wagmi (EVM) or @solana/web3.js (Solana).
 *
 * This hook provides a unified interface for the UI.
 */
export function useTokenBalance(): UseTokenBalanceResult {
    const [balance, setBalance] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBalance = useCallback(
        async (
            _chainId: string,
            _tokenAddress: string,
            _walletAddress: string
        ) => {
            setLoading(true);
            setError(null);
            try {
                // Balance fetching is delegated to the component
                // via wagmi's useBalance or Solana's getBalance
                // This hook just manages the state
                setBalance(null);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to fetch balance"
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    return { balance, loading, error, fetchBalance };
}
