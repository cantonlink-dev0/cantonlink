// src/components/UnifiedWalletButton.tsx
// Single "Connect Wallet" button that opens a modal with ALL wallet options:
//   - Canton (primary — we're on Canton Network)
//   - EVM (MetaMask, Rainbow, Coinbase, etc. via RainbowKit)
//   - Solana (Phantom, Solflare, etc. via wallet-adapter)
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAccount, useDisconnect as useEvmDisconnect } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useSession, useDisconnect as useCantonDisconnect } from "@cantonconnect/react";
import { useCantonWallet } from "@/lib/canton/useCantonWallet";

export function UnifiedWalletButton() {
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    // ─── EVM ─────────────────────────────────────────────────────────────────────
    const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
    const { openConnectModal } = useConnectModal();
    const { disconnect: evmDisconnect } = useEvmDisconnect();

    // ─── Solana ──────────────────────────────────────────────────────────────────
    const { publicKey, connected: isSolConnected, disconnect: solDisconnect } = useWallet();
    const { setVisible: openSolanaModal } = useWalletModal();
    const solAddress = useMemo(() => publicKey?.toBase58(), [publicKey]);

    // ─── Canton ──────────────────────────────────────────────────────────────────
    let cantonSession: { partyId?: string } | null = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        cantonSession = useSession();
    } catch {
        // Canton provider not mounted
    }
    const { disconnect: cantonDisconnect } = useCantonDisconnect();
    const cantonWallet = useCantonWallet();
    const isCantonConnected = cantonSession !== null || cantonWallet.connected;
    const cantonPartyId = cantonSession?.partyId || cantonWallet.partyId || null;

    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    // Count connected wallets
    const connectedCount = [isEvmConnected, isSolConnected, isCantonConnected].filter(Boolean).length;
    const anyConnected = connectedCount > 0;

    // Short address helpers
    const shortAddr = (addr: string | undefined) => {
        if (!addr) return "";
        return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
    };

    const handleCantonJwt = async (jwt: string, partyId: string) => {
        await cantonWallet.connect({ jwt, partyId });
    };

    return (
        <>
            {/* ── Main button ── */}
            <button
                onClick={() => setShowModal(true)}
                className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                    transition-all duration-200 border
                    ${anyConnected
                        ? "bg-gradient-to-r from-brand-600/20 to-yellow-500/10 border-brand-500/30 text-brand-300 hover:border-brand-400/50"
                        : "bg-gradient-to-r from-brand-600/15 to-purple-500/15 border-brand-500/25 text-brand-300 hover:border-brand-400/40 hover:shadow-lg hover:shadow-brand-500/10"
                    }`}
            >
                {/* Wallet icon */}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>

                {anyConnected ? (
                    <span className="flex items-center gap-1.5">
                        <span>Connected</span>
                        {connectedCount > 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400">
                                {connectedCount}
                            </span>
                        )}
                        {/* Green dot */}
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </span>
                ) : (
                    <span>Connect Wallet</span>
                )}
            </button>

            {/* ── Modal ── */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />

                    <div
                        className="relative z-10 w-full max-w-sm mx-4 rounded-2xl overflow-hidden
                            border border-white/10 shadow-2xl shadow-black/50"
                        style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 100%)" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <h2 className="text-white font-semibold text-sm">Connect Wallet</h2>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none">✕</button>
                        </div>

                        {/* Wallet sections */}
                        <div className="p-4 space-y-3">

                            {/* ── Canton (primary) ── */}
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-yellow-500/70 font-semibold mb-1.5 px-1">
                                    Canton Network — Primary
                                </div>
                                {isCantonConnected && cantonPartyId ? (
                                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                                        <div className="flex items-center gap-2">
                                            <img src="/chains/canton.svg" alt="Canton" className="w-6 h-6 rounded-full" />
                                            <div>
                                                <div className="text-xs font-mono text-yellow-300">{shortAddr(cantonPartyId)}</div>
                                                <div className="text-[10px] text-gray-500">Canton</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { cantonDisconnect(); cantonWallet.disconnect(); }}
                                            className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            // Open the Canton wallet modal — we'll use a custom event
                                            window.dispatchEvent(new CustomEvent("open-canton-wallet"));
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                                            border border-yellow-500/25 hover:border-yellow-400/40
                                            bg-yellow-500/10 hover:bg-yellow-500/15
                                            transition-all duration-150 text-left group"
                                    >
                                        <img src="/chains/canton.svg" alt="Canton" className="w-8 h-8 rounded-full flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-white text-sm font-semibold group-hover:text-yellow-300 transition-colors">
                                                Canton Wallet
                                            </div>
                                            <div className="text-gray-500 text-xs">Splice, DA Hub, JWT</div>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-600 group-hover:text-yellow-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-white/5" />

                            {/* ── EVM ── */}
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 px-1">
                                    EVM Chains
                                </div>
                                {isEvmConnected && evmAddress ? (
                                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-brand-500/20 bg-brand-500/5">
                                        <div className="flex items-center gap-2">
                                            <img src="/chains/ethereum.png" alt="EVM" className="w-6 h-6 rounded-full" />
                                            <div>
                                                <div className="text-xs font-mono text-brand-300">{shortAddr(evmAddress)}</div>
                                                <div className="text-[10px] text-gray-500">MetaMask / EVM</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => evmDisconnect()}
                                            className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            openConnectModal?.();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                            border border-white/10 hover:border-brand-500/30
                                            bg-white/5 hover:bg-brand-500/10
                                            transition-all duration-150 text-left group"
                                    >
                                        <img src="/chains/ethereum.png" alt="EVM" className="w-8 h-8 rounded-full flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-white text-sm font-medium group-hover:text-brand-300 transition-colors">
                                                EVM Wallets
                                            </div>
                                            <div className="text-gray-500 text-xs">MetaMask, Coinbase, Rainbow, Trust</div>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-600 group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* ── Solana ── */}
                            <div>
                                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1.5 px-1">
                                    Solana
                                </div>
                                {isSolConnected && solAddress ? (
                                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
                                        <div className="flex items-center gap-2">
                                            <img src="/chains/solana.png" alt="Solana" className="w-6 h-6 rounded-full" />
                                            <div>
                                                <div className="text-xs font-mono text-purple-300">{shortAddr(solAddress)}</div>
                                                <div className="text-[10px] text-gray-500">Solana</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => solDisconnect()}
                                            className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            openSolanaModal(true);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                                            border border-white/10 hover:border-purple-500/30
                                            bg-white/5 hover:bg-purple-500/10
                                            transition-all duration-150 text-left group"
                                    >
                                        <img src="/chains/solana.png" alt="Solana" className="w-8 h-8 rounded-full flex-shrink-0" />
                                        <div className="flex-1">
                                            <div className="text-white text-sm font-medium group-hover:text-purple-300 transition-colors">
                                                Solana Wallets
                                            </div>
                                            <div className="text-gray-500 text-xs">Phantom, Solflare, Backpack</div>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-white/5">
                            <p className="text-gray-600 text-[10px] text-center">
                                Connect multiple wallets to bridge across chains
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
