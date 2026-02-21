// src/lib/canton/useAttestationPoller.ts
//
// React hook that polls the Circle xReserve attestation API after
// an ETH → Canton deposit transaction is submitted.
//
// Usage:
//   const { status, attestationData } = useAttestationPoller(txHash);
//
// Returns status: "pending" | "confirmed" | "error"
// Once "confirmed", attestationData contains the DepositAttestation CID
// needed to call BridgeUserAgreement_Mint on Canton.

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type AttestationStatus = "idle" | "polling" | "confirmed" | "error";

export interface AttestationData {
    status: string;
    attestation?: string; // Base64-encoded attestation bytes
    depositAttestationCid?: string; // Canton contract id from the ledger
    messageHash?: string;
    completedAt?: number;
}

export interface AttestationPollerState {
    status: AttestationStatus;
    attestation: AttestationData | null;
    pollCount: number;
    error: string | null;
    elapsedSeconds: number;
}

const POLL_INTERVAL_MS = 15_000; // 15 sec — Circle typically takes 3-9 min
const MAX_POLLS = 60; // 15 min max before declaring timeout

export function useAttestationPoller(messageHash: string | null): AttestationPollerState & {
    startPolling: () => void;
    stopPolling: () => void;
} {
    const [state, setState] = useState<AttestationPollerState>({
        status: "idle",
        attestation: null,
        pollCount: 0,
        error: null,
        elapsedSeconds: 0,
    });

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pollCountRef = useRef(0);
    const startTimeRef = useRef<number>(0);
    const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
        timerRef.current = null;
        elapsedTimerRef.current = null;
    }, []);

    const poll = useCallback(async () => {
        if (!messageHash) return;
        if (pollCountRef.current >= MAX_POLLS) {
            stopPolling();
            setState((s) => ({ ...s, status: "error", error: "Attestation timed out after 15 minutes. Check txHash manually." }));
            return;
        }

        pollCountRef.current += 1;

        try {
            const res = await fetch(`/api/canton?action=attestation&msgHash=${encodeURIComponent(messageHash)}`);
            const json = await res.json();

            if (json.success && json.data) {
                const data: AttestationData = json.data;

                if (data.status === "complete" || data.status === "COMPLETE" || data.attestation) {
                    stopPolling();
                    setState((s) => ({
                        ...s,
                        status: "confirmed",
                        attestation: data,
                        pollCount: pollCountRef.current,
                    }));
                    return;
                }
            }

            // Still pending — schedule next poll
            setState((s) => ({ ...s, status: "polling", pollCount: pollCountRef.current }));
            timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Poll failed";
            // Don't stop polling on transient errors — just try again
            console.warn("[AttestationPoller]", message);
            setState((s) => ({ ...s, status: "polling", pollCount: pollCountRef.current }));
            timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        }
    }, [messageHash, stopPolling]);

    const startPolling = useCallback(() => {
        if (!messageHash) return;
        pollCountRef.current = 0;
        startTimeRef.current = Date.now();
        setState({ status: "polling", attestation: null, pollCount: 0, error: null, elapsedSeconds: 0 });

        // Elapsed second counter for UI
        elapsedTimerRef.current = setInterval(() => {
            setState((s) => ({
                ...s,
                elapsedSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
            }));
        }, 1000);

        // First poll immediately, then every POLL_INTERVAL_MS
        poll();
    }, [messageHash, poll]);

    // Auto-start when messageHash is provided
    useEffect(() => {
        if (messageHash) {
            startPolling();
        }
        return () => stopPolling();
    }, [messageHash]); // eslint-disable-line react-hooks/exhaustive-deps

    return { ...state, startPolling, stopPolling };
}
