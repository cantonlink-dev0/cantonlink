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

                <Footer />
            </body>
        </html>
    );
}
