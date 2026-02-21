// src/lib/hooks/useBridgeExecution.ts
// Hook: manages bridge transaction lifecycle with status polling
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { StatusState } from "@/lib/utils/constants";
import type { StatusResponse } from "@/lib/schemas/status";
import type { Route } from "@/lib/schemas/route";
import { saveRoute, updateRouteStatus } from "@/lib/store/transactionStore";

const POLL_INTERVAL_MS = 10_000; // 10 seconds

interface UseBridgeExecutionResult {
    status: StatusState;
    bridgeStatus: StatusResponse | null;
    txHash: string | null;
    error: string | null;
    executeBridge: (route: Route) => Promise<void>;
    setTxHashAndPoll: (hash: string, route: Route) => void;
    reset: () => void;
}

export function useBridgeExecution(): UseBridgeExecutionResult {
    const [status, setStatus] = useState<StatusState>("IDLE");
    const [bridgeStatus, setBridgeStatus] = useState<StatusResponse | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const routeRef = useRef<Route | null>(null);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const pollStatus = useCallback(
        async (hash: string, fromChainId: string, toChainId: string) => {
            try {
                const params = new URLSearchParams({
                    txHash: hash,
                    fromChain: fromChainId,
                    toChain: toChainId,
                });

                const response = await fetch(`/api/bridge/status?${params.toString()}`);
                const data: StatusResponse = await response.json();

                setBridgeStatus(data);

                if (data.status === "COMPLETED") {
                    setStatus("COMPLETED");
                    if (routeRef.current) {
                        updateRouteStatus(routeRef.current.routeId, "COMPLETED", {
                            toTxHash: data.toTxHash,
                        });
                    }
                    if (pollRef.current) {
                        clearInterval(pollRef.current);
                        pollRef.current = null;
                    }
                } else if (data.status === "FAILED") {
                    setStatus("FAILED");
                    setError(data.error || "Bridge transaction failed");
                    if (routeRef.current) {
                        updateRouteStatus(routeRef.current.routeId, "FAILED");
                    }
                    if (pollRef.current) {
                        clearInterval(pollRef.current);
                        pollRef.current = null;
                    }
                } else {
                    setStatus("BRIDGING");
                }
            } catch (err) {
                console.error("Status poll error:", err);
            }
        },
        []
    );

    const setTxHashAndPoll = useCallback(
        (hash: string, route: Route) => {
            setTxHash(hash);
            routeRef.current = route;
            setStatus("BRIDGING");

            // Persist for resume
            saveRoute({
                routeId: route.routeId,
                fromTxHash: hash,
                provider: route.provider,
                status: "BRIDGING",
                fromChainId: route.fromChainId,
                toChainId: route.toChainId,
                fromToken: route.fromToken.address,
                toToken: route.toToken.address,
                fromAmount: route.fromAmount,
                createdAt: route.createdAt,
                updatedAt: Date.now(),
            });

            // Start polling
            if (pollRef.current) clearInterval(pollRef.current);
            pollStatus(hash, route.fromChainId, route.toChainId);
            pollRef.current = setInterval(
                () => pollStatus(hash, route.fromChainId, route.toChainId),
                POLL_INTERVAL_MS
            );
        },
        [pollStatus]
    );

    const executeBridge = useCallback(async (route: Route) => {
        setError(null);
        routeRef.current = route;

        // Check for approval step
        const approvalStep = route.steps.find((s) => s.type === "approve");
        if (approvalStep) {
            setStatus("APPROVAL_REQUIRED");
            return;
        }

        setStatus("EXECUTING");
    }, []);

    const reset = useCallback(() => {
        setStatus("IDLE");
        setBridgeStatus(null);
        setTxHash(null);
        setError(null);
        routeRef.current = null;
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    return {
        status,
        bridgeStatus,
        txHash,
        error,
        executeBridge,
        setTxHashAndPoll,
        reset,
    };
}
