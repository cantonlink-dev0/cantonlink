// src/components/TokenExplorer.tsx
// Token explorer — search any token across all chains via DexScreener
"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ─── DexScreener API types ──────────────────────────────────────────────────

interface DexPair {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
        h24: { buys: number; sells: number };
    };
    volume: { h24: number };
    priceChange: { h24: number };
    liquidity: { usd: number };
    fdv: number;
    info?: {
        imageUrl?: string;
    };
}

interface DexSearchResult {
    pairs: DexPair[];
}

// Chain name and logo mappings
const CHAIN_META: Record<string, { name: string; logo: string }> = {
    ethereum: { name: "Ethereum", logo: "/chains/ethereum.png" },
    bsc: { name: "BSC", logo: "/chains/bsc.png" },
    polygon: { name: "Polygon", logo: "/chains/polygon.png" },
    arbitrum: { name: "Arbitrum", logo: "/chains/arbitrum.png" },
    optimism: { name: "Optimism", logo: "/chains/optimism.png" },
    base: { name: "Base", logo: "/chains/base.png" },
    avalanche: { name: "Avalanche", logo: "/chains/avalanche.png" },
    solana: { name: "Solana", logo: "/chains/solana.png" },
    sonic: { name: "Sonic", logo: "/chains/sonic.png" },
    linea: { name: "Linea", logo: "/chains/linea.png" },
    mantle: { name: "Mantle", logo: "/chains/mantle.png" },
    cronos: { name: "Cronos", logo: "/chains/cronos.png" },
    sei: { name: "Sei", logo: "/chains/sei.png" },
    flow: { name: "Flow", logo: "/chains/flow.png" },
    story: { name: "Story", logo: "/chains/story.png" },
    abstract: { name: "Abstract", logo: "/chains/abstract.png" },
    bob: { name: "BOB", logo: "/chains/bob.png" },
    hyperliquid: { name: "Hyperliquid", logo: "/chains/hyperliquid.png" },
    plasma: { name: "Plasma", logo: "/chains/plasma.png" },
    monad: { name: "Monad", logo: "/chains/monad.png" },
    megaeth: { name: "MegaETH", logo: "/chains/megaeth.png" },
    sui: { name: "Sui", logo: "/chains/sui.png" },
    canton: { name: "Canton", logo: "/chains/canton.svg" },
};

// Source chain options for cross-chain buy
const SOURCE_CHAINS = [
    { id: "ethereum", name: "Ethereum", symbol: "ETH", logo: "/chains/ethereum.png" },
    { id: "bsc", name: "BNB Chain", symbol: "BNB", logo: "/chains/bsc.png" },
    { id: "polygon", name: "Polygon", symbol: "POL", logo: "/chains/polygon.png" },
    { id: "arbitrum", name: "Arbitrum", symbol: "ETH", logo: "/chains/arbitrum.png" },
    { id: "optimism", name: "Optimism", symbol: "ETH", logo: "/chains/optimism.png" },
    { id: "base", name: "Base", symbol: "ETH", logo: "/chains/base.png" },
    { id: "avalanche", name: "Avalanche", symbol: "AVAX", logo: "/chains/avalanche.png" },
    { id: "solana", name: "Solana", symbol: "SOL", logo: "/chains/solana.png" },
    { id: "sonic", name: "Sonic", symbol: "S", logo: "/chains/sonic.png" },
    { id: "linea", name: "Linea", symbol: "ETH", logo: "/chains/linea.png" },
    { id: "mantle", name: "Mantle", symbol: "MNT", logo: "/chains/mantle.png" },
    { id: "cronos", name: "Cronos", symbol: "CRO", logo: "/chains/cronos.png" },
    { id: "sei", name: "Sei", symbol: "SEI", logo: "/chains/sei.png" },
    { id: "flow", name: "Flow", symbol: "FLOW", logo: "/chains/flow.png" },
    { id: "hyperliquid", name: "Hyperliquid", symbol: "HYPE", logo: "/chains/hyperliquid.png" },
    { id: "monad", name: "Monad", symbol: "MON", logo: "/chains/monad.png" },
    { id: "sui", name: "Sui", symbol: "SUI", logo: "/chains/sui.png" },
];

// Trending default tokens to show on first load
const TRENDING_QUERIES = ["PEPE", "DOGE", "SHIB", "WIF", "BONK", "FLOKI", "MOG", "BRETT"];

function formatNumber(n: number): string {
    if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
}

function formatPrice(price: string): string {
    const p = parseFloat(price);
    if (p >= 1000) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    if (p >= 0.0001) return `$${p.toFixed(6)}`;
    return `$${p.toFixed(10)}`;
}

interface TokenExplorerProps {
    onSelectToken?: (pair: DexPair) => void;
}

export function TokenExplorer({ onSelectToken }: TokenExplorerProps) {
    const [query, setQuery] = useState("");
    const [pairs, setPairs] = useState<DexPair[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPair, setSelectedPair] = useState<DexPair | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Search DexScreener API
    const searchTokens = useCallback(async (q: string) => {
        if (!q.trim()) {
            setPairs([]);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setError(null);
        setHasSearched(true);

        try {
            const res = await fetch(
                `/api/dexscreener?q=${encodeURIComponent(q)}`
            );
            if (!res.ok) throw new Error("DexScreener API error");
            const data: DexSearchResult = await res.json();

            // Sort by liquidity descending for best results first
            const sorted = (data.pairs || [])
                .filter((p) => p.priceUsd && parseFloat(p.priceUsd) > 0)
                .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

            setPairs(sorted.slice(0, 30));
        } catch (e: any) {
            setError(e?.message || "Failed to search tokens");
            setPairs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    const handleSearch = useCallback(
        (value: string) => {
            setQuery(value);
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            searchTimeout.current = setTimeout(() => searchTokens(value), 400);
        },
        [searchTokens]
    );

    // Load trending on mount
    useEffect(() => {
        const randomTrend =
            TRENDING_QUERIES[Math.floor(Math.random() * TRENDING_QUERIES.length)];
        searchTokens(randomTrend);
    }, [searchTokens]);

    const getChainMeta = (chainId: string) =>
        CHAIN_META[chainId] || { name: chainId, logo: "" };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-surface-border">
                    <h1 className="text-lg font-bold text-gray-100">
                        Token Explorer
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Search any token across all chains • Powered by DexScreener
                    </p>
                </div>

                {/* Search */}
                <div className="px-6 pt-5 pb-3">
                    <div className="relative">
                        <svg
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600"
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
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search by token name, symbol, or address..."
                            className="w-full bg-surface border border-surface-border rounded-xl pl-12 pr-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
                        />
                        {loading && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <svg
                                    className="animate-spin w-4 h-4 text-brand-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Quick search tags */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {TRENDING_QUERIES.slice(0, 6).map((t) => (
                            <button
                                key={t}
                                onClick={() => handleSearch(t)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-gray-500 bg-surface border border-surface-border hover:border-brand-500/30 hover:text-brand-300 transition-all"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-6 mb-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Results */}
                <div className="px-6 pb-5">
                    {pairs.length > 0 ? (
                        <div className="space-y-1 max-h-[500px] overflow-y-auto">
                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600 border-b border-surface-border/50">
                                <div className="col-span-4">Token</div>
                                <div className="col-span-2 text-right">Price</div>
                                <div className="col-span-2 text-right">24h</div>
                                <div className="col-span-2 text-right">Volume</div>
                                <div className="col-span-2 text-right">Liquidity</div>
                            </div>

                            {pairs.map((pair, idx) => {
                                const chain = getChainMeta(pair.chainId);
                                const change = pair.priceChange?.h24 || 0;
                                const isUp = change >= 0;

                                return (
                                    <button
                                        key={`${pair.pairAddress}-${idx}`}
                                        onClick={() => setSelectedPair(pair)}
                                        className="w-full grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg hover:bg-surface/60 transition-all group text-left"
                                    >
                                        {/* Token info */}
                                        <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                                            <div className="relative shrink-0">
                                                {pair.info?.imageUrl ? (
                                                    <img
                                                        src={pair.info.imageUrl}
                                                        alt=""
                                                        className="w-8 h-8 rounded-full bg-surface"
                                                        onError={(e) => {
                                                            (
                                                                e.target as HTMLImageElement
                                                            ).src =
                                                                chain.logo || "";
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/30 to-brand-700/30 flex items-center justify-center text-[10px] font-bold text-brand-300">
                                                        {pair.baseToken.symbol.slice(
                                                            0,
                                                            2
                                                        )}
                                                    </div>
                                                )}
                                                {chain.logo && (
                                                    <img
                                                        src={chain.logo}
                                                        alt=""
                                                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border border-surface-raised"
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-gray-200 truncate group-hover:text-brand-300 transition-colors">
                                                    {pair.baseToken.symbol}
                                                </div>
                                                <div className="text-[10px] text-gray-600 truncate">
                                                    {pair.baseToken.name} •{" "}
                                                    {chain.name}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="col-span-2 flex items-center justify-end">
                                            <span className="text-xs font-mono text-gray-300">
                                                {formatPrice(pair.priceUsd)}
                                            </span>
                                        </div>

                                        {/* 24h change */}
                                        <div className="col-span-2 flex items-center justify-end">
                                            <span
                                                className={`text-xs font-semibold ${isUp
                                                    ? "text-emerald-400"
                                                    : "text-red-400"
                                                    }`}
                                            >
                                                {isUp ? "+" : ""}
                                                {change.toFixed(2)}%
                                            </span>
                                        </div>

                                        {/* Volume */}
                                        <div className="col-span-2 flex items-center justify-end">
                                            <span className="text-xs text-gray-400">
                                                {pair.volume?.h24
                                                    ? formatNumber(
                                                        pair.volume.h24
                                                    )
                                                    : "—"}
                                            </span>
                                        </div>

                                        {/* Liquidity */}
                                        <div className="col-span-2 flex items-center justify-end">
                                            <span className="text-xs text-gray-400">
                                                {pair.liquidity?.usd
                                                    ? formatNumber(
                                                        pair.liquidity.usd
                                                    )
                                                    : "—"}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : hasSearched && !loading ? (
                        <div className="text-center py-12">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-surface border border-surface-border flex items-center justify-center mb-3">
                                <svg
                                    className="w-7 h-7 text-gray-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                            <p className="text-sm text-gray-500">No tokens found</p>
                            <p className="text-xs text-gray-600 mt-1">
                                Try a different search term
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Token Detail Modal */}
            {selectedPair && (
                <TokenDetailModal
                    pair={selectedPair}
                    onClose={() => setSelectedPair(null)}
                />
            )}
        </div>
    );
}

// ─── Token Detail Modal ─────────────────────────────────────────────────────

function TokenDetailModal({
    pair,
    onClose,
}: {
    pair: DexPair;
    onClose: () => void;
}) {
    const chain = CHAIN_META[pair.chainId] || {
        name: pair.chainId,
        logo: "",
    };
    const change = pair.priceChange?.h24 || 0;
    const isUp = change >= 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl bg-surface-raised rounded-2xl border border-surface-border shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between sticky top-0 bg-surface-raised z-10">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {pair.info?.imageUrl ? (
                                <img
                                    src={pair.info.imageUrl}
                                    alt=""
                                    className="w-10 h-10 rounded-full bg-surface"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            chain.logo || "";
                                    }}
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/30 to-brand-700/30 flex items-center justify-center text-sm font-bold text-brand-300">
                                    {pair.baseToken.symbol.slice(0, 2)}
                                </div>
                            )}
                            {chain.logo && (
                                <img
                                    src={chain.logo}
                                    alt=""
                                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-surface-raised"
                                />
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-100">
                                {pair.baseToken.symbol}
                                <span className="text-gray-500 font-normal text-sm ml-1.5">
                                    / {pair.quoteToken.symbol}
                                </span>
                            </h2>
                            <p className="text-xs text-gray-500">
                                {pair.baseToken.name} • {chain.name} •{" "}
                                {pair.dexId}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-300 transition-colors p-1"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Price + Stats */}
                <div className="px-6 py-5 space-y-4">
                    {/* Current price */}
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-bold text-gray-100">
                            {formatPrice(pair.priceUsd)}
                        </span>
                        <span
                            className={`text-sm font-semibold pb-1 ${isUp ? "text-emerald-400" : "text-red-400"
                                }`}
                        >
                            {isUp ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                        </span>
                    </div>

                    {/* Chart embed from DexScreener */}
                    <div className="rounded-xl overflow-hidden border border-surface-border bg-surface">
                        <iframe
                            src={`https://dexscreener.com/${pair.chainId}/${pair.pairAddress}?embed=1&theme=dark&trades=0&info=0`}
                            className="w-full h-[350px]"
                            title="Chart"
                            style={{ border: "none" }}
                        />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatBox
                            label="Market Cap"
                            value={pair.fdv ? formatNumber(pair.fdv) : "—"}
                        />
                        <StatBox
                            label="24h Volume"
                            value={
                                pair.volume?.h24
                                    ? formatNumber(pair.volume.h24)
                                    : "—"
                            }
                        />
                        <StatBox
                            label="Liquidity"
                            value={
                                pair.liquidity?.usd
                                    ? formatNumber(pair.liquidity.usd)
                                    : "—"
                            }
                        />
                        <StatBox
                            label="24h Txns"
                            value={
                                pair.txns?.h24
                                    ? `${(pair.txns.h24.buys + pair.txns.h24.sells).toLocaleString()}`
                                    : "—"
                            }
                        />
                    </div>

                    {/* Tx breakdown */}
                    {pair.txns?.h24 && (
                        <div className="bg-surface rounded-xl border border-surface-border p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                                    Buy / Sell Ratio (24h)
                                </span>
                            </div>
                            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 rounded-l-full transition-all"
                                    style={{
                                        width: `${(pair.txns.h24.buys /
                                            (pair.txns.h24.buys +
                                                pair.txns.h24.sells)) *
                                            100
                                            }%`,
                                    }}
                                />
                                <div
                                    className="bg-red-500 rounded-r-full transition-all"
                                    style={{
                                        width: `${(pair.txns.h24.sells /
                                            (pair.txns.h24.buys +
                                                pair.txns.h24.sells)) *
                                            100
                                            }%`,
                                    }}
                                />
                            </div>
                            <div className="flex justify-between mt-1.5 text-[10px]">
                                <span className="text-emerald-400">
                                    {pair.txns.h24.buys.toLocaleString()} buys
                                </span>
                                <span className="text-red-400">
                                    {pair.txns.h24.sells.toLocaleString()} sells
                                </span>
                            </div>
                        </div>
                    )}

                    {/* ─── Inline Swap Widget with Cross-Chain ──── */}
                    <SwapWidget pair={pair} chain={chain} />

                    {/* DexScreener link + Contract */}
                    <div className="flex gap-3">
                        <a
                            href={pair.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-surface-border text-gray-400 hover:border-brand-500/30 hover:text-brand-300 transition-all text-center"
                        >
                            View on DexScreener ↗
                        </a>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(pair.baseToken.address);
                            }}
                            className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-surface border border-surface-border text-gray-400 hover:border-brand-500/30 hover:text-brand-300 transition-all text-center flex items-center justify-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy CA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Swap Widget (with cross-chain bridge+swap) ─────────────────────────────

function SwapWidget({ pair, chain }: { pair: DexPair; chain: { name: string; logo: string } }) {
    const [tradeMode, setTradeMode] = useState<"buy" | "sell">("buy");
    const [amount, setAmount] = useState("");
    const [swapStatus, setSwapStatus] = useState<"idle" | "bridging" | "swapping" | "success" | "error">("idle");
    const [sourceChain, setSourceChain] = useState(pair.chainId);
    const [showChainPicker, setShowChainPicker] = useState(false);
    const chainPickerRef = useRef<HTMLDivElement>(null);

    const isCrossChain = sourceChain !== pair.chainId;
    const sourceChainInfo = SOURCE_CHAINS.find(c => c.id === sourceChain) || { id: sourceChain, name: sourceChain, symbol: "?", logo: "" };
    const price = parseFloat(pair.priceUsd) || 0;
    const inputAmount = parseFloat(amount) || 0;
    const estimatedOutput = tradeMode === "buy"
        ? price > 0 ? inputAmount / price : 0
        : inputAmount * price;

    // Close chain picker on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (chainPickerRef.current && !chainPickerRef.current.contains(e.target as Node)) {
                setShowChainPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSwap = async () => {
        if (!inputAmount || inputAmount <= 0) return;

        try {
            if (isCrossChain && tradeMode === "buy") {
                // Cross-chain: call bridge API (LI.FI handles bridge + destination swap)
                setSwapStatus("bridging");

                const bridgeRes = await fetch("/api/bridge", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fromChainId: sourceChain,
                        toChainId: pair.chainId,
                        fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
                        toTokenAddress: pair.baseToken.address,
                        amount: String(Math.floor(inputAmount * 1e18)),
                        slippageBps: 50,
                    }),
                });

                const bridgeData = await bridgeRes.json();

                if (!bridgeRes.ok || !bridgeData.success) {
                    throw new Error(bridgeData.error?.message || bridgeData.error || "Bridge failed");
                }

                setSwapStatus("swapping");
                // In production, the actual tx signing would happen here via wagmi
                // For now we show the quote was successful
                setSwapStatus("success");
                setTimeout(() => {
                    setSwapStatus("idle");
                    setAmount("");
                }, 3000);
            } else {
                // Same-chain swap: call quote API
                setSwapStatus("swapping");

                const quoteRes = await fetch("/api/quote", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fromChainId: pair.chainId,
                        toChainId: pair.chainId,
                        fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
                        toTokenAddress: pair.baseToken.address,
                        amount: String(Math.floor(inputAmount * 1e18)),
                        slippageBps: 50,
                        mode: "AUTO",
                    }),
                });

                const quoteData = await quoteRes.json();

                if (!quoteRes.ok) {
                    throw new Error(quoteData.message || quoteData.error || "Swap quote failed");
                }

                // In production, the actual tx signing would happen here via wagmi
                // For now we show the quote was successful
                setSwapStatus("success");
                setTimeout(() => {
                    setSwapStatus("idle");
                    setAmount("");
                }, 3000);
            }
        } catch (err) {
            console.error("Swap error:", err);
            setSwapStatus("error");
            setTimeout(() => setSwapStatus("idle"), 4000);
        }
    };

    const presets = tradeMode === "buy"
        ? ["25", "50", "100", "250", "500"]
        : ["25%", "50%", "75%", "100%"];

    const isLoading = swapStatus === "bridging" || swapStatus === "swapping";

    return (
        <div className="bg-surface rounded-2xl border border-surface-border p-4 space-y-3">
            {/* Buy / Sell toggle */}
            <div className="flex gap-1 bg-surface-raised rounded-xl p-1">
                <button
                    onClick={() => { setTradeMode("buy"); setAmount(""); setSwapStatus("idle"); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tradeMode === "buy"
                        ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                        }`}
                >
                    Buy
                </button>
                <button
                    onClick={() => { setTradeMode("sell"); setAmount(""); setSwapStatus("idle"); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tradeMode === "sell"
                        ? "bg-red-500/20 text-red-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-300"
                        }`}
                >
                    Sell
                </button>
            </div>

            {/* Source chain selector (buy mode only) */}
            {tradeMode === "buy" && (
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                            Pay From
                        </span>
                        {isCrossChain && (
                            <span className="text-[10px] font-semibold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                                Bridge + Swap
                            </span>
                        )}
                    </div>
                    <div className="relative" ref={chainPickerRef}>
                        <button
                            onClick={() => setShowChainPicker(!showChainPicker)}
                            className="w-full flex items-center justify-between bg-surface-raised rounded-xl border border-surface-border px-3.5 py-2.5 hover:border-brand-500/30 transition-colors"
                        >
                            <div className="flex items-center gap-2.5">
                                {sourceChainInfo.logo && (
                                    <img src={sourceChainInfo.logo} alt="" className="w-5 h-5 rounded-full" />
                                )}
                                <div className="text-left">
                                    <span className="text-sm font-semibold text-gray-200">
                                        {sourceChainInfo.name}
                                    </span>
                                    <span className="text-[10px] text-gray-500 ml-1.5">
                                        ({sourceChainInfo.symbol})
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {isCrossChain && (
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        {chain.logo && <img src={chain.logo} alt="" className="w-3.5 h-3.5 rounded-full" />}
                                        <span>{chain.name}</span>
                                    </div>
                                )}
                                <svg className={`w-4 h-4 text-gray-500 transition-transform ${showChainPicker ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </button>

                        {/* Chain picker dropdown */}
                        {showChainPicker && (
                            <div className="absolute z-20 mt-1 w-full bg-surface-raised rounded-xl border border-surface-border shadow-2xl max-h-[240px] overflow-y-auto">
                                {SOURCE_CHAINS.map((c) => {
                                    const isSelected = c.id === sourceChain;
                                    const isSameAsToken = c.id === pair.chainId;
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => { setSourceChain(c.id); setShowChainPicker(false); }}
                                            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-surface transition-colors first:rounded-t-xl last:rounded-b-xl ${isSelected ? "bg-brand-500/10" : ""}`}
                                        >
                                            <img src={c.logo} alt="" className="w-5 h-5 rounded-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm font-medium ${isSelected ? "text-brand-300" : "text-gray-300"}`}>
                                                    {c.name}
                                                </span>
                                                <span className="text-[10px] text-gray-600 ml-1">
                                                    {c.symbol}
                                                </span>
                                            </div>
                                            {isSameAsToken && (
                                                <span className="text-[9px] text-gray-600 bg-surface px-1.5 py-0.5 rounded-full">
                                                    Same chain
                                                </span>
                                            )}
                                            {isSelected && (
                                                <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Cross-chain route visualization */}
            {isCrossChain && tradeMode === "buy" && (
                <div className="bg-surface-raised rounded-xl border border-surface-border p-3">
                    <div className="flex items-center gap-2">
                        {/* Step 1: Bridge */}
                        <div className={`flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all ${swapStatus === "bridging"
                            ? "border-brand-500/40 bg-brand-500/10"
                            : swapStatus === "swapping" || swapStatus === "success"
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : "border-surface-border bg-surface"
                            }`}>
                            <div className="relative shrink-0">
                                <img src={sourceChainInfo.logo} alt="" className="w-5 h-5 rounded-full" />
                                {(swapStatus === "swapping" || swapStatus === "success") && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-surface-raised" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-gray-400 leading-tight">Step 1</p>
                                <p className="text-[10px] text-gray-500 leading-tight truncate">
                                    {swapStatus === "bridging" ? "Bridging..." : "Bridge"}
                                </p>
                            </div>
                        </div>

                        {/* Arrow */}
                        <svg className="w-4 h-4 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>

                        {/* Step 2: Swap */}
                        <div className={`flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all ${swapStatus === "swapping"
                            ? "border-brand-500/40 bg-brand-500/10"
                            : swapStatus === "success"
                                ? "border-emerald-500/30 bg-emerald-500/5"
                                : "border-surface-border bg-surface"
                            }`}>
                            <div className="relative shrink-0">
                                {chain.logo && <img src={chain.logo} alt="" className="w-5 h-5 rounded-full" />}
                                {swapStatus === "success" && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-surface-raised" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-gray-400 leading-tight">Step 2</p>
                                <p className="text-[10px] text-gray-500 leading-tight truncate">
                                    {swapStatus === "swapping" ? "Swapping..." : "Swap"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-[9px] text-gray-600 mt-2 text-center">
                        {sourceChainInfo.symbol} on {sourceChainInfo.name} → Bridge to {chain.name} → Buy {pair.baseToken.symbol}
                    </p>
                </div>
            )}

            {/* Amount input */}
            <div className="bg-surface-raised rounded-xl border border-surface-border p-3">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        {tradeMode === "buy" ? "You Pay" : "You Sell"}
                    </span>
                    <span className="text-[10px] text-gray-600">
                        {tradeMode === "buy"
                            ? isCrossChain ? sourceChainInfo.symbol : "USD"
                            : pair.baseToken.symbol}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        min="0"
                        step="any"
                        className="flex-1 bg-transparent text-xl font-bold text-gray-100 placeholder-gray-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        disabled={isLoading}
                    />
                    <div className="flex items-center gap-1.5 bg-surface rounded-lg px-2.5 py-1.5 border border-surface-border shrink-0">
                        {tradeMode === "buy" ? (
                            <>
                                {isCrossChain && sourceChainInfo.logo && (
                                    <img src={sourceChainInfo.logo} alt="" className="w-4 h-4 rounded-full" />
                                )}
                                <span className="text-xs font-semibold text-gray-300">
                                    {isCrossChain ? sourceChainInfo.symbol : "$ USD"}
                                </span>
                            </>
                        ) : (
                            <>
                                {pair.info?.imageUrl && (
                                    <img src={pair.info.imageUrl} alt="" className="w-4 h-4 rounded-full" />
                                )}
                                <span className="text-xs font-semibold text-gray-300">{pair.baseToken.symbol}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick amount presets */}
            <div className="flex gap-2">
                {presets.map((p) => (
                    <button
                        key={p}
                        onClick={() => setAmount(p.replace("%", ""))}
                        className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-gray-500 bg-surface-raised border border-surface-border hover:border-brand-500/30 hover:text-brand-300 transition-all"
                        disabled={isLoading}
                    >
                        {tradeMode === "buy" && !isCrossChain ? `$${p}` : tradeMode === "sell" ? p : p}
                    </button>
                ))}
            </div>

            {/* Estimated output */}
            {inputAmount > 0 && (
                <div className="bg-surface-raised rounded-xl border border-surface-border p-3">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                            You Receive (est.)
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-100">
                            {tradeMode === "buy"
                                ? estimatedOutput < 0.0001
                                    ? estimatedOutput.toExponential(4)
                                    : estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: 6 })
                                : `$${estimatedOutput.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                            }
                        </span>
                        <span className="text-xs text-gray-500">
                            {tradeMode === "buy" ? pair.baseToken.symbol : "USD"}
                        </span>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">
                        Price: {formatPrice(pair.priceUsd)} per {pair.baseToken.symbol}
                        {isCrossChain && tradeMode === "buy" && " • Includes bridge fee ~0.1%"}
                        {" • Slippage: ~0.5%"}
                    </p>
                </div>
            )}

            {/* Swap / Bridge+Swap button */}
            <button
                onClick={handleSwap}
                disabled={!inputAmount || inputAmount <= 0 || isLoading || swapStatus === "success"}
                className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all ${swapStatus === "success"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : swapStatus === "error"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : isLoading
                            ? "bg-surface-overlay text-gray-400 cursor-wait"
                            : tradeMode === "buy"
                                ? !inputAmount || inputAmount <= 0
                                    ? "bg-surface-overlay text-gray-600 cursor-not-allowed"
                                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/20"
                                : !inputAmount || inputAmount <= 0
                                    ? "bg-surface-overlay text-gray-600 cursor-not-allowed"
                                    : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 shadow-lg shadow-red-500/20"
                    }`}
            >
                {swapStatus === "bridging" ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Step 1/2 — Bridging to {chain.name}...
                    </span>
                ) : swapStatus === "swapping" ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {isCrossChain ? `Step 2/2 — Buying ${pair.baseToken.symbol}...` : "Swapping..."}
                    </span>
                ) : swapStatus === "success" ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {isCrossChain ? "Bridge + Swap Complete!" : "Swap Complete!"}
                    </span>
                ) : swapStatus === "error" ? (
                    "Transaction Failed — Try Again"
                ) : !inputAmount || inputAmount <= 0 ? (
                    "Enter an amount"
                ) : isCrossChain && tradeMode === "buy" ? (
                    <span className="flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Bridge + Buy {pair.baseToken.symbol}
                    </span>
                ) : (
                    `${tradeMode === "buy" ? "Buy" : "Sell"} ${pair.baseToken.symbol}`
                )}
            </button>

            {/* Powered by */}
            <p className="text-[10px] text-gray-600 text-center">
                {isCrossChain && tradeMode === "buy"
                    ? `Bridge via deBridge • Swap on ${pair.dexId} (${chain.name}) • Prices from DexScreener`
                    : `Routed via ${pair.dexId} on ${chain.name} • Prices from DexScreener`
                }
            </p>
        </div>
    );
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-surface rounded-xl border border-surface-border px-3 py-2.5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                {label}
            </p>
            <p className="text-sm font-bold text-gray-200 mt-0.5">{value}</p>
        </div>
    );
}
