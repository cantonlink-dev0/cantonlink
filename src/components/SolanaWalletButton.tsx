// src/components/SolanaWalletButton.tsx
// Solana wallet connect button — uses @solana/wallet-adapter for Phantom, Solflare, etc.
"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback, useMemo } from "react";

export function SolanaWalletButton() {
    const { publicKey, wallet, disconnect, connecting, connected } = useWallet();
    const { setVisible } = useWalletModal();

    const base58 = useMemo(() => publicKey?.toBase58(), [publicKey]);
    const displayAddress = useMemo(() => {
        if (!base58) return "";
        return `${base58.slice(0, 4)}...${base58.slice(-4)}`;
    }, [base58]);

    const handleClick = useCallback(() => {
        if (connected) {
            disconnect();
        } else {
            setVisible(true);
        }
    }, [connected, disconnect, setVisible]);

    return (
        <button
            onClick={handleClick}
            disabled={connecting}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border ${connected
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20"
                }`}
        >
            {/* Phantom/Solana icon */}
            {wallet?.adapter.icon ? (
                <img
                    src={wallet.adapter.icon}
                    alt={wallet.adapter.name}
                    className="w-4 h-4 rounded-sm"
                />
            ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" fill="#AB9FF2" opacity="0.8" />
                    <path
                        d="M17.5 12.5c0 3-2.5 5.5-5.5 5.5s-5.5-2.5-5.5-5.5S8.5 7 12 7s5.5 2.5 5.5 5.5z"
                        fill="white"
                        opacity="0.9"
                    />
                </svg>
            )}

            {connecting ? (
                <span className="animate-pulse">Connecting...</span>
            ) : connected ? (
                <span>{displayAddress}</span>
            ) : (
                <span>Solana</span>
            )}
        </button>
    );
}
