// src/app/page.tsx
// Home page — CantonFlow: Swap & Bridge, OTC P2P Trading, Token Explorer
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { TokenExplorer } from "@/components/TokenExplorer";
import { PriceTicker } from "@/components/PriceTicker";
import { RibbonBackground } from "@/components/RibbonBackground";
import { ConnectButton } from "@rainbow-me/rainbowkit";

// Dynamic imports with ssr:false — prevents Canton hooks (useSession, useConnect) from
// running server-side where CantonConnectProvider is not mounted (cantonClient is null).
const SwapBridgeApp = dynamic(
    () => import("@/components/SwapBridgeApp").then(mod => ({ default: mod.SwapBridgeApp })),
    { ssr: false, loading: () => <div className="animate-pulse h-96 w-full max-w-lg rounded-2xl bg-white/5" /> }
);
const OTCApp = dynamic(
    () => import("@/components/otc/OTCApp").then(mod => ({ default: mod.OTCApp })),
    { ssr: false, loading: () => <div className="animate-pulse h-96 w-full max-w-lg rounded-2xl bg-white/5" /> }
);
const CantonWalletButton = dynamic(
    () => import("@/components/CantonWalletButton").then(mod => ({ default: mod.CantonWalletButton })),
    { ssr: false }
);
const SolanaWalletButton = dynamic(
    () => import("@/components/SolanaWalletButton").then(mod => ({ default: mod.SolanaWalletButton })),
    { ssr: false }
);

type AppTab = "swap" | "otc" | "explore";

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<AppTab>("swap");

    return (
        <>
            {/* Animated ribbon background */}
            <RibbonBackground />

            {/* Rolling price ticker — always visible */}
            <PriceTicker />

            <main className="flex flex-col items-center justify-start px-3 py-4 sm:px-4 md:px-8 pt-6 md:pt-8">
                {/* Logo / Title area + Connect Wallet */}
                <div className="mb-5 w-full max-w-lg animate-fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {/* Logo — CantonLink CC mark */}
                            <div className="w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center flex-shrink-0">
                                <img
                                    src="/cantonlink-logo.png"
                                    alt="CantonLink"
                                    className="w-full h-full"
                                    style={{
                                        filter: 'drop-shadow(0 0 16px rgba(250, 204, 21, 0.4)) brightness(1.1)',
                                    }}
                                />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-extrabold font-display bg-gradient-to-r from-brand-300 via-gold-400 to-brand-400 bg-clip-text text-transparent tracking-tight">
                                    CantonLink
                                </h1>
                                <p className="text-[10px] sm:text-[11px] text-gray-500 tracking-wide">
                                    Swapping & Bridging on Canton
                                </p>
                            </div>
                        </div>

                        {/* Wallet connect buttons — Solana + EVM + Canton */}
                        <div className="flex items-center gap-2">
                            <SolanaWalletButton />
                            <CantonWalletButton />
                            <ConnectButton
                                label="EVM Wallets"
                                accountStatus="avatar"
                                chainStatus="icon"
                                showBalance={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Main navigation tabs */}
                <div className="mb-6 flex gap-1 glass-purple rounded-2xl p-1.5 shadow-lg border-glow">
                    <button
                        onClick={() => setActiveTab("swap")}
                        className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${activeTab === "swap"
                            ? "bg-gradient-to-r from-brand-600/25 to-brand-500/15 text-brand-300 shadow-sm border border-brand-500/25"
                            : "text-gray-500 hover:text-gray-300 border border-transparent"
                            }`}
                    >
                        <span className="flex items-center gap-1.5 sm:gap-2">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                                />
                            </svg>
                            Swap
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("otc")}
                        className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${activeTab === "otc"
                            ? "bg-gradient-to-r from-brand-600/25 to-brand-500/15 text-brand-300 shadow-sm border border-brand-500/25"
                            : "text-gray-500 hover:text-gray-300 border border-transparent"
                            }`}
                    >
                        <span className="flex items-center gap-1.5 sm:gap-2">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            OTC
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab("explore")}
                        className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${activeTab === "explore"
                            ? "bg-gradient-to-r from-brand-600/25 to-brand-500/15 text-brand-300 shadow-sm border border-brand-500/25"
                            : "text-gray-500 hover:text-gray-300 border border-transparent"
                            }`}
                    >
                        <span className="flex items-center gap-1.5 sm:gap-2">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            Explore
                        </span>
                    </button>
                </div>

                {/* Main App Content */}
                {activeTab === "swap" && <SwapBridgeApp />}
                {activeTab === "otc" && <OTCApp />}
                {activeTab === "explore" && <TokenExplorer />}
            </main>
        </>
    );
}
