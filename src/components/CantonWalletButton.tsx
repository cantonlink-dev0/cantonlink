// src/components/CantonWalletButton.tsx
//
// Canton Network wallet connection — three auth methods:
//   1. DA Hub Login (OIDC) — recommended for production users
//   2. Canton Extension — window.dablHub or window.canton browser extension
//   3. Paste JWT — for users with their own Canton node JWT
//
// Connected state shows party ID + USDCx balance + disconnect.

"use client";

import { useState, useEffect } from "react";
import { useSession, useConnect as useCantonConnect, useDisconnect as useCantonDisconnect } from "@cantonconnect/react";
import { useCantonWallet } from "@/lib/canton/useCantonWallet";

// ─── DA Hub Login ──────────────────────────────────────────────────────────────

async function getDaHubLoginUrl(): Promise<string | null> {
    try {
        const res = await fetch("/api/canton/auth?action=url");
        const json = await res.json();
        return json.success ? json.url : null;
    } catch { return null; }
}

// ─── Paste JWT Modal Panel ────────────────────────────────────────────────────

function JwtPastePanel({
    onSubmit,
    onCancel,
    isLoading,
    error,
}: {
    onSubmit: (jwt: string, partyId: string) => void;
    onCancel: () => void;
    isLoading: boolean;
    error: string | null;
}) {
    const [jwt, setJwt] = useState("");
    const [partyId, setPartyId] = useState("");

    const handleSubmit = () => {
        if (!jwt.trim()) return;
        onSubmit(jwt.trim(), partyId.trim());
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Canton JWT</label>
                <textarea
                    value={jwt}
                    onChange={(e) => setJwt(e.target.value)}
                    placeholder="eyJhbGci..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono
                        bg-white/5 border border-white/10 text-gray-200
                        focus:outline-none focus:border-yellow-500/40
                        resize-none placeholder:text-gray-600"
                />
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">
                    Party ID <span className="text-gray-600">(optional — auto-extracted from JWT)</span>
                </label>
                <input
                    type="text"
                    value={partyId}
                    onChange={(e) => setPartyId(e.target.value)}
                    placeholder="alice::1220..."
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono
                        bg-white/5 border border-white/10 text-gray-200
                        focus:outline-none focus:border-yellow-500/40
                        placeholder:text-gray-600"
                />
            </div>
            {error && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-xs">{error}</p>
                </div>
            )}
            <div className="flex gap-2">
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !jwt.trim()}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold
                        bg-yellow-500/20 border border-yellow-500/30
                        text-yellow-300 hover:bg-yellow-500/30
                        disabled:opacity-40 disabled:cursor-not-allowed
                        transition-all"
                >
                    {isLoading ? "Connecting..." : "Connect"}
                </button>
                <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg text-xs text-gray-500
                        hover:text-gray-300 transition-colors"
                >
                    Back
                </button>
            </div>
            <p className="text-gray-600 text-[10px] text-center">
                Generate a JWT:{" "}
                <code className="text-gray-500">scripts\generate-canton-jwt.ps1 -PartyId &quot;your::party&quot;</code>
            </p>
        </div>
    );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

function CantonWalletModal({
    isOpen,
    onClose,
    onJwtSubmit,
    isConnecting,
    error,
}: {
    isOpen: boolean;
    onClose: () => void;
    onJwtSubmit: (jwt: string, partyId: string) => void;
    isConnecting: boolean;
    error: string | null;
}) {
    const [view, setView] = useState<"menu" | "paste">("menu");
    const [daHubLoading, setDaHubLoading] = useState(false);

    const handleDaHubLogin = async () => {
        setDaHubLoading(true);
        const url = await getDaHubLoginUrl();
        if (url) {
            window.location.href = url;
        } else {
            // No OIDC configured — guide user
            window.open("https://hub.daml.com", "_blank", "noopener");
            setDaHubLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div
                className="relative z-10 w-full max-w-sm mx-4 rounded-2xl overflow-hidden
                    border border-white/10 shadow-2xl shadow-black/50"
                style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 100%)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        {view === "paste" && (
                            <button onClick={() => setView("menu")} className="text-gray-500 hover:text-gray-300 mr-1">
                                ←
                            </button>
                        )}
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-purple-600 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-white">C</span>
                        </div>
                        <h2 className="text-white font-semibold text-sm">Connect Canton Wallet</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none">✕</button>
                </div>

                {/* Body */}
                <div className="p-4">
                    {view === "paste" ? (
                        <JwtPastePanel
                            onSubmit={onJwtSubmit}
                            onCancel={() => setView("menu")}
                            isLoading={isConnecting}
                            error={error}
                        />
                    ) : (
                        <div className="space-y-2">
                            {/* Splice Wallet — official Canton Network wallet */}
                            <button
                                onClick={() => {
                                    window.open("https://wallet.canton.network", "_blank", "noopener");
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                                    border border-yellow-500/20 hover:border-yellow-400/40
                                    bg-yellow-500/10 hover:bg-yellow-500/15
                                    transition-all duration-150 text-left group"
                            >
                                <span className="text-2xl">🔗</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white text-sm font-semibold group-hover:text-yellow-300 transition-colors">
                                        Splice Wallet
                                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-normal">
                                            Official
                                        </span>
                                    </div>
                                    <div className="text-gray-500 text-xs">Canton Network wallet — Canton Coin (CC)</div>
                                </div>
                                <svg className="w-4 h-4 text-gray-600 group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </button>

                            {/* DA Hub OIDC */}
                            <button
                                onClick={handleDaHubLogin}
                                disabled={daHubLoading}
                                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                                    border border-white/10 hover:border-yellow-500/30
                                    bg-white/5 hover:bg-yellow-500/10
                                    transition-all duration-150 text-left group"
                            >
                                <span className="text-2xl">🏛️</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white text-sm font-medium group-hover:text-yellow-300 transition-colors">
                                        DA Hub Login
                                    </div>
                                    <div className="text-gray-500 text-xs">Sign in with Digital Asset Hub OIDC</div>
                                </div>
                                {daHubLoading ? (
                                    <div className="w-4 h-4 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-4 h-4 text-gray-600 group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </button>

                            {/* Canton Coin Wallet */}
                            <button
                                onClick={() => {
                                    window.open("https://www.canton.network/canton-coin", "_blank", "noopener");
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                    border border-white/5 hover:border-white/15
                                    bg-white/5 hover:bg-white/8
                                    transition-all duration-150 text-left group"
                            >
                                <span className="text-2xl">💰</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white text-sm font-medium group-hover:text-gray-200 transition-colors">
                                        Canton Coin Wallet
                                    </div>
                                    <div className="text-gray-500 text-xs">Official Canton Coin app — pay & receive CC</div>
                                </div>
                                <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </button>

                            {/* Institutional: Dfns + Copper */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => window.open("https://www.dfns.co", "_blank", "noopener")}
                                    className="flex-1 flex items-center gap-2 px-3 py-3 rounded-xl
                                        border border-white/5 hover:border-white/10
                                        bg-white/[0.03] hover:bg-white/5
                                        transition-all duration-150 text-left group"
                                >
                                    <span className="text-lg">🏦</span>
                                    <div className="min-w-0">
                                        <div className="text-gray-300 text-xs font-medium group-hover:text-gray-200 transition-colors">Dfns</div>
                                        <div className="text-gray-600 text-[10px]">Institutional</div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => window.open("https://copper.co", "_blank", "noopener")}
                                    className="flex-1 flex items-center gap-2 px-3 py-3 rounded-xl
                                        border border-white/5 hover:border-white/10
                                        bg-white/[0.03] hover:bg-white/5
                                        transition-all duration-150 text-left group"
                                >
                                    <span className="text-lg">🏦</span>
                                    <div className="min-w-0">
                                        <div className="text-gray-300 text-xs font-medium group-hover:text-gray-200 transition-colors">Copper</div>
                                        <div className="text-gray-600 text-[10px]">Institutional</div>
                                    </div>
                                </button>
                            </div>

                            {/* Paste JWT */}
                            <button
                                onClick={() => setView("paste")}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                    border border-white/5 hover:border-white/15
                                    bg-white/[0.03] hover:bg-white/5
                                    transition-all duration-150 text-left group"
                            >
                                <span className="text-2xl">🔑</span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-gray-300 text-sm font-medium group-hover:text-gray-200 transition-colors">
                                        Paste JWT Token
                                    </div>
                                    <div className="text-gray-600 text-xs">Self-hosted node or DA Hub token</div>
                                </div>
                                <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {error && (
                                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 mt-2">
                                    <p className="text-red-400 text-xs">{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-white/5">
                    <p className="text-gray-600 text-xs text-center">
                        New to Canton?{" "}
                        <a href="https://hub.daml.com" target="_blank" rel="noopener noreferrer"
                            className="text-yellow-500 hover:text-yellow-400 transition-colors">
                            Get a DA Hub account →
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Main Button ──────────────────────────────────────────────────────────────

export function CantonWalletButton() {
    // @cantonconnect/react (extension-based)
    const cantonSession = useSession();
    const { connect: cantonConnect } = useCantonConnect();
    const { disconnect: cantonDisconnect } = useCantonDisconnect();

    // Our hook (JWT-based)
    const wallet = useCantonWallet();

    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Listen for custom event from UnifiedWalletButton
    useEffect(() => {
        const handler = () => setShowModal(true);
        window.addEventListener("open-canton-wallet", handler);
        return () => window.removeEventListener("open-canton-wallet", handler);
    }, []);

    if (!mounted) return null;

    // Determine connection state (either source)
    const isConnected = cantonSession !== null || wallet.connected;
    const partyId = cantonSession?.partyId || wallet.partyId || null;
    const isConnecting = wallet.connecting;
    const error = wallet.error;

    const handleJwtSubmit = async (jwt: string, partyId: string) => {
        await wallet.connect({ jwt, partyId });
        if (!wallet.error) setShowModal(false);
    };

    // Only render the modal — the visible button is now handled by UnifiedWalletButton
    return (
        <CantonWalletModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onJwtSubmit={handleJwtSubmit}
            isConnecting={isConnecting}
            error={error}
        />
    );
}
