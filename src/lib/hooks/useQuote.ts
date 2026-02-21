// src/lib/hooks/useQuote.ts
// Hook: fetches a unified quote via the /api/quote route
"use client";

import { useState, useCallback } from "react";
import type { Route } from "@/lib/schemas/route";
import type { RoutingError } from "@/lib/schemas/route";
import type { Mode } from "@/lib/utils/constants";

interface UseQuoteParams {
    fromChainId: string;
    toChainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    slippageBps: number;
    mode: Mode;
    senderAddress?: string;
    recipientAddress?: string;
}

interface UseQuoteResult {
    quote: Route | null;
    error: RoutingError | null;
    loading: boolean;
    fetchQuote: (params: UseQuoteParams) => Promise<void>;
    clearQuote: () => void;
}

export function useQuote(): UseQuoteResult {
    const [quote, setQuote] = useState<Route | null>(null);
    const [error, setError] = useState<RoutingError | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchQuote = useCallback(async (params: UseQuoteParams) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/quote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data as RoutingError);
                setQuote(null);
            } else {
                setQuote(data as Route);
                setError(null);
            }
        } catch (err) {
            setError({
                code: "NETWORK_ERROR",
                message: err instanceof Error ? err.message : "Failed to fetch quote",
            });
            setQuote(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearQuote = useCallback(() => {
        setQuote(null);
        setError(null);
    }, []);

    return { quote, error, loading, fetchQuote, clearQuote };
}
