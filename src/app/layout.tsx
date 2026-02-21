// src/app/layout.tsx
// Root layout — server component that wraps the entire app

import type { Metadata } from "next";
import { Providers } from "./providers";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
    title: "CantonLink | Swapping & Bridging on Canton",
    description:
        "Swap tokens, bridge assets, and trade P2P across 35+ chains. Powered by ParaSwap, Jupiter, and LI.FI.",
    keywords: [
        "cantonlink",
        "canton network",
        "swap",
        "bridge",
        "defi",
        "cross-chain",
        "otc",
        "p2p",
        "ethereum",
        "solana",
        "arbitrum",
        "base",
        "polygon",
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body className="flex flex-col min-h-screen">
                <Providers>
                    <div className="flex-1">{children}</div>
                </Providers>

                {/* Footer */}
                <footer className="w-full border-t border-purple-900/30 bg-gradient-to-b from-black/40 to-black/60 backdrop-blur-md mt-auto">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        {/* Links Row */}
                        <div className="flex flex-wrap items-center justify-center gap-8 text-sm mb-6">
                            <a
                                href="/legal/terms"
                                className="text-gray-400 hover:text-purple-400 transition-all duration-300 hover:scale-105"
                            >
                                Terms of Service
                            </a>
                            <span className="text-purple-900">•</span>
                            <a
                                href="/legal/privacy"
                                className="text-gray-400 hover:text-purple-400 transition-all duration-300 hover:scale-105"
                            >
                                Privacy Policy
                            </a>
                            <span className="text-purple-900">•</span>
                            <a
                                href="https://twitter.com/cantonlink"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-purple-400 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                                <span>Twitter</span>
                            </a>
                        </div>

                        {/* Copyright Row */}
                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                © 2026 <span className="text-purple-400 font-semibold">CantonLink</span>. All rights reserved.
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                Swapping & Bridging on Canton
                            </p>
                        </div>
                    </div>
                </footer>
            </body>
        </html>
    );
}
