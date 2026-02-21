// src/lib/canton/useCantonWallet.ts
//
// Canton wallet hook — PRODUCTION JWT FLOW
//
// Session storage: localStorage key "canton_session"
// { jwt: string, partyId: string, method: string, exp: number }
//
// Auth methods (in priority order):
//   1. DA Hub OIDC → JWT issued by Digital Asset's auth server
//   2. Browser Extension → window.dablHub or window.canton injects itself
//   3. Manual JWT paste → user provides their own JWT from Canton node
//
// The JWT is forwarded as Authorization: Bearer <jwt> on every /api/canton request.
// The server reads it per-request (not the singleton env var).

"use client";

import { useState, useEffect, useCallback } from "react";

const SESSION_KEY = "canton_session";

export interface CantonSession {
    jwt: string;
    partyId: string;
    method: "daml-hub-oidc" | "daml-hub-extension" | "canton-extension" | "manual" | "auto";
    exp: number | null; // Unix timestamp
}

export interface CantonWalletState {
    connected: boolean;
    connecting: boolean;
    partyId: string | null;
    bridgeAgreementCid: string | null;
    usdcxHoldings: Array<{ contractId: string; amount: string }>;
    error: string | null;
    method: CantonSession["method"] | null;
    jwtExpired: boolean;
}

export interface DAMLIntent {
    type: string;
    [key: string]: unknown;
}

export interface CantonWalletActions {
    connect: (opts?: { jwt?: string; partyId?: string }) => Promise<void>;
    disconnect: () => void;
    signAndSubmit: (intent: DAMLIntent) => Promise<{ transactionId: string }>;
    refreshHoldings: () => Promise<void>;
    getJwt: () => string | null;
}

// ── Storage helpers ────────────────────────────────────────────────────────────

function saveSession(session: CantonSession): void {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* SSR/private */ }
}

function loadSession(): CantonSession | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw) as CantonSession;
        // Expire check
        if (s.exp && s.exp < Math.floor(Date.now() / 1000)) return null;
        return s;
    } catch { return null; }
}

function clearSession(): void {
    try { localStorage.removeItem(SESSION_KEY); } catch { /* SSR */ }
}

// ── JWT decode (client-side, no signature verify) ─────────────────────────────

function decodeJwt(jwt: string): { partyId: string | null; exp: number | null } {
    try {
        const parts = jwt.split(".");
        if (parts.length !== 3) return { partyId: null, exp: null };
        const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
        const obj = JSON.parse(atob(padded)) as Record<string, unknown>;
        const daml = obj["https://daml.com/ledger-api"] as Record<string, unknown> | undefined;
        let partyId: string | null = null;
        if (Array.isArray(daml?.actAs) && daml.actAs[0]) partyId = String(daml.actAs[0]);
        else if (typeof obj.sub === "string" && obj.sub.includes("::")) partyId = obj.sub;
        const exp = typeof obj.exp === "number" ? obj.exp : null;
        return { partyId, exp };
    } catch { return { partyId: null, exp: null }; }
}

// ── Canton API fetch helper (always includes JWT as Authorization) ──────────────

async function cantonFetch(
    url: string,
    jwt: string | null,
    options: RequestInit = {}
): Promise<Response> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string> || {}),
    };
    if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
    return fetch(url, { ...options, headers });
}

// ── Browser extension detection ────────────────────────────────────────────────

function detectExtension(): "daml-hub-extension" | "canton-extension" | null {
    if (typeof window === "undefined") return null;
    if ((window as unknown as Record<string, unknown>).dablHub) return "daml-hub-extension";
    if ((window as unknown as Record<string, unknown>).canton) return "canton-extension";
    return null;
}

// ── Sign via extension ────────────────────────────────────────────────────────

async function signViaExtension(intent: DAMLIntent, method: "daml-hub-extension" | "canton-extension"): Promise<{ transactionId: string }> {
    if (method === "daml-hub-extension") {
        const hub = (window as unknown as Record<string, unknown>).dablHub as {
            submitCommand: (cmd: unknown) => Promise<{ commandId: string }>;
        };
        const result = await hub.submitCommand(intent);
        return { transactionId: result.commandId };
    }
    const canton = (window as unknown as Record<string, unknown>).canton as {
        signTransaction: (tx: unknown) => Promise<{ txId: string }>;
    };
    const result = await canton.signTransaction(intent);
    return { transactionId: result.txId };
}

// ── Sign via server (uses user JWT forwarded to /api/canton) ──────────────────

async function signViaServer(intent: DAMLIntent, jwt: string): Promise<{ transactionId: string }> {
    const { type: intentType } = intent;
    const action = intentType === "canton:swap" ? "swap"
        : intentType === "canton:bridge:mint" ? "mint"
            : intentType === "canton:bridge:burn" ? "burn"
                : null;

    if (!action) throw new Error(`Unknown Canton intent type: ${intentType}`);

    const res = await cantonFetch("/api/canton", jwt, {
        method: "POST",
        body: JSON.stringify({ action, ...intent }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Canton server execution failed");
    return { transactionId: JSON.stringify(json.data).substring(0, 64) };
}

// ── Main hook ──────────────────────────────────────────────────────────────────

export function useCantonWallet(): CantonWalletState & CantonWalletActions {
    const [session, setSession] = useState<CantonSession | null>(null);
    const [state, setState] = useState<CantonWalletState>({
        connected: false,
        connecting: false,
        partyId: null,
        bridgeAgreementCid: null,
        usdcxHoldings: [],
        error: null,
        method: null,
        jwtExpired: false,
    });

    // Load saved session on mount
    useEffect(() => {
        const saved = loadSession();
        if (saved) {
            setSession(saved);
            setState(s => ({
                ...s,
                connected: true,
                partyId: saved.partyId,
                method: saved.method,
                jwtExpired: false,
            }));
            // Load holdings in background
            fetchHoldings(saved.partyId, saved.jwt).then(holdings => {
                setState(s => ({ ...s, usdcxHoldings: holdings }));
            });
            // Load bridge agreement in background
            fetchBridgeAgreement(saved.partyId, saved.jwt).then(agreement => {
                setState(s => ({ ...s, bridgeAgreementCid: agreement?.contractId ?? null }));
            });
        }

        // Handle DA Hub OIDC callback (jwt in URL params)
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            const urlJwt = params.get("canton_jwt");
            const urlParty = params.get("canton_party");
            const urlError = params.get("canton_error");
            if (urlJwt) {
                // Clean URL
                params.delete("canton_jwt");
                params.delete("canton_party");
                params.delete("canton_state");
                const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
                window.history.replaceState({}, "", newUrl);
                // Store session
                const decoded = decodeJwt(urlJwt);
                const partyId = urlParty || decoded.partyId || "";
                if (partyId) {
                    const s: CantonSession = { jwt: urlJwt, partyId, method: "daml-hub-oidc", exp: decoded.exp };
                    saveSession(s);
                    setSession(s);
                    setState(prev => ({ ...prev, connected: true, partyId, method: "daml-hub-oidc" }));
                }
            }
            if (urlError) {
                params.delete("canton_error");
                const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
                window.history.replaceState({}, "", newUrl);
                setState(prev => ({ ...prev, error: urlError }));
            }
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const getJwt = useCallback((): string | null => session?.jwt || null, [session]);

    const refreshHoldings = useCallback(async () => {
        if (!state.partyId || !session?.jwt) return;
        const holdings = await fetchHoldings(state.partyId, session.jwt);
        setState(s => ({ ...s, usdcxHoldings: holdings }));
    }, [state.partyId, session]);

    const connect = useCallback(async (opts?: { jwt?: string; partyId?: string }) => {
        setState(s => ({ ...s, connecting: true, error: null }));

        try {
            // Path A: manual JWT provided (paste flow)
            if (opts?.jwt) {
                const decoded = decodeJwt(opts.jwt);
                const partyId = opts.partyId || decoded.partyId;
                if (!partyId) throw new Error("Could not extract Canton party ID from JWT. Check the JWT format.");

                // Validate against ledger (this confirms the JWT works)
                const res = await cantonFetch("/api/canton?action=party", opts.jwt);
                const json = await res.json();
                if (!res.ok && json.authRequired) throw new Error("JWT rejected by Canton ledger. Check your JWT is valid for this node.");

                const newSession: CantonSession = { jwt: opts.jwt, partyId, method: "manual", exp: decoded.exp };
                saveSession(newSession);
                setSession(newSession);

                const [agreement, holdings] = await Promise.all([
                    fetchBridgeAgreement(partyId, opts.jwt),
                    fetchHoldings(partyId, opts.jwt),
                ]);
                setState(s => ({
                    ...s,
                    connected: true,
                    connecting: false,
                    partyId,
                    method: "manual",
                    bridgeAgreementCid: agreement?.contractId ?? null,
                    usdcxHoldings: holdings,
                    error: null,
                }));
                return;
            }

            // Path B: browser extension
            const extMethod = detectExtension();
            if (extMethod) {
                let partyId: string | null = null;
                let jwt = "";

                if (extMethod === "daml-hub-extension") {
                    const hub = (window as unknown as Record<string, unknown>).dablHub as {
                        getParty: () => Promise<{ party: string; token?: string }>;
                    };
                    const info = await hub.getParty();
                    partyId = info.party;
                    jwt = info.token || "";
                } else {
                    const canton = (window as unknown as Record<string, unknown>).canton as {
                        connect: () => Promise<{ partyId: string; token?: string }>;
                    };
                    const info = await canton.connect();
                    partyId = info.partyId;
                    jwt = info.token || "";
                }

                if (!partyId) throw new Error("Extension connected but returned no party ID");

                const newSession: CantonSession = {
                    jwt,
                    partyId,
                    method: extMethod,
                    exp: jwt ? decodeJwt(jwt).exp : null
                };
                if (jwt) saveSession(newSession);
                setSession(newSession);

                const [agreement, holdings] = await Promise.all([
                    jwt ? fetchBridgeAgreement(partyId, jwt) : null,
                    jwt ? fetchHoldings(partyId, jwt) : null,
                ]);
                setState(s => ({
                    ...s,
                    connected: true,
                    connecting: false,
                    partyId,
                    method: extMethod,
                    bridgeAgreementCid: agreement?.contractId ?? null,
                    usdcxHoldings: holdings || [],
                    error: null,
                }));
                return;
            }

            // Path C: no extension, no manual JWT → prompt user
            throw new Error("No Canton wallet found. Use DA Hub Login, paste your JWT, or install a Canton wallet extension.");

        } catch (err) {
            setState(s => ({
                ...s,
                connecting: false,
                error: err instanceof Error ? err.message : "Canton connection failed",
            }));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const disconnect = useCallback(() => {
        clearSession();
        setSession(null);
        setState({
            connected: false,
            connecting: false,
            partyId: null,
            bridgeAgreementCid: null,
            usdcxHoldings: [],
            error: null,
            method: null,
            jwtExpired: false,
        });
    }, []);

    const signAndSubmit = useCallback(async (intent: DAMLIntent): Promise<{ transactionId: string }> => {
        const extMethod = detectExtension();
        if (extMethod) return signViaExtension(intent, extMethod);
        if (!session?.jwt) throw new Error("Not connected to Canton wallet. Please connect first.");
        return signViaServer(intent, session.jwt);
    }, [session]);

    return { ...state, connect, disconnect, signAndSubmit, refreshHoldings, getJwt };
}

// ── Helpers (module-level, not hooks) ─────────────────────────────────────────

async function fetchBridgeAgreement(party: string, jwt: string): Promise<{ contractId: string } | null> {
    try {
        const res = await cantonFetch(`/api/canton?action=bridge-agreement&party=${encodeURIComponent(party)}`, jwt);
        const json = await res.json();
        if (json.success) return { contractId: json.data.contractId };
        return null;
    } catch { return null; }
}

async function fetchHoldings(party: string, jwt: string): Promise<Array<{ contractId: string; amount: string }>> {
    try {
        const res = await cantonFetch(`/api/canton?action=holdings&party=${encodeURIComponent(party)}`, jwt);
        const json = await res.json();
        if (json.success) return json.data;
        return [];
    } catch { return []; }
}
