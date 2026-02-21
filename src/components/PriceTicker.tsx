// src/components/PriceTicker.tsx
// Rolling marquee-style price ticker showing all supported chain native tokens
"use client";

import { useState, useEffect } from "react";

interface TickerItem {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    logo: string;
}

// All our supported chains with their native token prices
// Grouped by: major L1s, major L2s, emerging chains, non-EVM
const CHAIN_PRICES: TickerItem[] = [
    // ─── Major L1s ───
    { symbol: "ETH", name: "Ethereum", price: 2635.18, change24h: 1.87, logo: "/chains/ethereum.png" },
    { symbol: "SOL", name: "Solana", price: 196.75, change24h: 4.12, logo: "/chains/solana.png" },
    { symbol: "BNB", name: "BNB Chain", price: 634.22, change24h: -0.42, logo: "/chains/bsc.png" },
    { symbol: "POL", name: "Polygon", price: 0.4523, change24h: -1.23, logo: "/chains/polygon.png" },
    { symbol: "AVAX", name: "Avalanche", price: 25.67, change24h: 3.15, logo: "/chains/avalanche.png" },
    { symbol: "SUI", name: "Sui", price: 3.42, change24h: 6.78, logo: "/chains/sui.png" },
    // ─── Major L2s / Rollups ───
    { symbol: "ARB", name: "Arbitrum", price: 0.8234, change24h: 0.89, logo: "/chains/arbitrum.png" },
    { symbol: "OP", name: "Optimism", price: 1.456, change24h: -0.67, logo: "/chains/optimism.png" },
    { symbol: "MNT", name: "Mantle", price: 0.8912, change24h: 1.78, logo: "/chains/mantle.png" },
    { symbol: "CRO", name: "Cronos", price: 0.0987, change24h: -1.56, logo: "/chains/cronos.png" },
    // ─── Emerging / Next-gen ───
    { symbol: "S", name: "Sonic", price: 0.5678, change24h: 12.34, logo: "/chains/sonic.png" },
    { symbol: "SEI", name: "Sei", price: 0.3456, change24h: 3.21, logo: "/chains/sei.png" },
    { symbol: "HYPE", name: "Hyperliquid", price: 24.87, change24h: 5.67, logo: "/chains/hyperliquid.png" },
    { symbol: "FLOW", name: "Flow", price: 0.6789, change24h: 1.23, logo: "/chains/flow.png" },
    { symbol: "IP", name: "Story", price: 4.56, change24h: 15.67, logo: "/chains/story.png" },
    { symbol: "MON", name: "Monad", price: 2.34, change24h: 7.89, logo: "/chains/monad.png" },
    { symbol: "MEGA", name: "MegaETH", price: 0.15, change24h: 3.45, logo: "/chains/megaeth.png" },
    // ─── Canton ───
    { symbol: "CC", name: "Canton", price: 8.76, change24h: 4.56, logo: "/chains/canton.svg" },
];

function formatPrice(price: number): string {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
}

export function PriceTicker() {
    const [prices, setPrices] = useState<TickerItem[]>(CHAIN_PRICES);

    // Simulate tiny price movements every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setPrices(prev =>
                prev.map(item => {
                    const jitter = (Math.random() - 0.5) * 0.002; // ±0.1% jitter
                    const newPrice = item.price * (1 + jitter);
                    const changeJitter = (Math.random() - 0.5) * 0.1;
                    return {
                        ...item,
                        price: newPrice,
                        change24h: item.change24h + changeJitter,
                    };
                })
            );
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Render ticker items
    const renderItems = (keyPrefix: string) =>
        prices.map((item, idx) => (
            <div
                key={`${keyPrefix}-${item.symbol}-${idx}`}
                className="flex items-center gap-2 shrink-0"
            >
                <img
                    src={item.logo}
                    alt={item.symbol}
                    className="w-4 h-4 rounded-full"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                />
                <span className="text-[11px] font-semibold text-gray-400">
                    {item.symbol}
                </span>
                <span className="text-[11px] font-mono text-gray-300">
                    {formatPrice(item.price)}
                </span>
                <span
                    className={`text-[10px] font-semibold ${item.change24h >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                        }`}
                >
                    {item.change24h >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(item.change24h).toFixed(2)}%
                </span>
            </div>
        ));

    return (
        <div className="w-full bg-[#0c0e18] border-b border-surface-border/30 overflow-hidden relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0c0e18] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0c0e18] to-transparent z-10 pointer-events-none" />

            {/* Seamless infinite scroll: two identical copies side by side */}
            <div className="flex w-max animate-marquee" style={{ animationDuration: "90s" }}>
                <div className="flex items-center gap-6 py-2 px-4 shrink-0">
                    {renderItems("a")}
                </div>
                <div className="flex items-center gap-6 py-2 px-4 shrink-0">
                    {renderItems("b")}
                </div>
            </div>
        </div>
    );
}
