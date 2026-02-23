// src/components/PriceTicker.tsx
// Rolling marquee-style price ticker showing all supported chain native tokens
// Fetches real prices from CoinGecko API on mount and refreshes every 60s
"use client";

import { useState, useEffect, useCallback } from "react";

interface TickerItem {
    symbol: string;
    name: string;
    price: number;
    change24h: number;
    logo: string;
    coingeckoId: string;
}

// All our supported chains with their CoinGecko IDs for real price fetching
const CHAIN_TOKENS: TickerItem[] = [
    // ─── Major L1s ───
    { symbol: "ETH", name: "Ethereum", price: 0, change24h: 0, logo: "/chains/ethereum.png", coingeckoId: "ethereum" },
    { symbol: "SOL", name: "Solana", price: 0, change24h: 0, logo: "/chains/solana.png", coingeckoId: "solana" },
    { symbol: "BNB", name: "BNB Chain", price: 0, change24h: 0, logo: "/chains/bsc.png", coingeckoId: "binancecoin" },
    { symbol: "POL", name: "Polygon", price: 0, change24h: 0, logo: "/chains/polygon.png", coingeckoId: "matic-network" },
    { symbol: "AVAX", name: "Avalanche", price: 0, change24h: 0, logo: "/chains/avalanche.png", coingeckoId: "avalanche-2" },
    { symbol: "SUI", name: "Sui", price: 0, change24h: 0, logo: "/chains/sui.png", coingeckoId: "sui" },
    // ─── Major L2s / Rollups ───
    { symbol: "ARB", name: "Arbitrum", price: 0, change24h: 0, logo: "/chains/arbitrum.png", coingeckoId: "arbitrum" },
    { symbol: "OP", name: "Optimism", price: 0, change24h: 0, logo: "/chains/optimism.png", coingeckoId: "optimism" },
    { symbol: "MNT", name: "Mantle", price: 0, change24h: 0, logo: "/chains/mantle.png", coingeckoId: "mantle" },
    { symbol: "CRO", name: "Cronos", price: 0, change24h: 0, logo: "/chains/cronos.png", coingeckoId: "crypto-com-chain" },
    // ─── Emerging / Next-gen ───
    { symbol: "S", name: "Sonic", price: 0, change24h: 0, logo: "/chains/sonic.png", coingeckoId: "sonic-3" },
    { symbol: "SEI", name: "Sei", price: 0, change24h: 0, logo: "/chains/sei.png", coingeckoId: "sei-network" },
    { symbol: "HYPE", name: "Hyperliquid", price: 0, change24h: 0, logo: "/chains/hyperliquid.png", coingeckoId: "hyperliquid" },
    { symbol: "FLOW", name: "Flow", price: 0, change24h: 0, logo: "/chains/flow.png", coingeckoId: "flow" },
    { symbol: "IP", name: "Story", price: 0, change24h: 0, logo: "/chains/story.png", coingeckoId: "story-2" },
];

const REFRESH_INTERVAL = 60_000; // 60 seconds

function formatPrice(price: number): string {
    if (price === 0) return "—";
    if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
}

export function PriceTicker() {
    const [prices, setPrices] = useState<TickerItem[]>(CHAIN_TOKENS);
    const [lastUpdate, setLastUpdate] = useState<number>(0);

    const fetchPrices = useCallback(async () => {
        try {
            const ids = CHAIN_TOKENS.map(t => t.coingeckoId).join(",");
            const res = await fetch(
                `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
                { cache: "no-store" }
            );
            if (!res.ok) return;
            const data = await res.json();

            setPrices(prev =>
                prev.map(item => {
                    const coinData = data[item.coingeckoId];
                    if (!coinData) return item;
                    return {
                        ...item,
                        price: coinData.usd ?? item.price,
                        change24h: coinData.usd_24h_change ?? item.change24h,
                    };
                })
            );
            setLastUpdate(Date.now());
        } catch {
            // Silently fail — keep previous prices
        }
    }, []);

    // Fetch on mount + interval
    useEffect(() => {
        fetchPrices();
        const interval = setInterval(fetchPrices, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchPrices]);

    // Render ticker items
    const renderItems = (keyPrefix: string) =>
        prices
            .filter(item => item.price > 0) // Only show tokens with loaded prices
            .map((item, idx) => (
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
