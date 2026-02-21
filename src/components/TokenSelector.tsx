// src/components/TokenSelector.tsx
// Token selector with live DexScreener search for any token on any chain
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { getTokensForChain, type TokenInfo } from "@/lib/tokens/tokenList";
import { NATIVE_TOKEN_ADDRESS } from "@/lib/utils/constants";

interface TokenSelectorProps {
    chainId: string;
    value: string; // token address
    onChange: (tokenAddress: string) => void;
    label: string;
}

// Map our numeric chainIds to DexScreener slugs
const CHAIN_TO_DEXSCREENER: Record<string, string> = {
    "1": "ethereum",
    "56": "bsc",
    "137": "polygon",
    "43114": "avalanche",

    "42161": "arbitrum",
    "10": "optimism",
    "8453": "base",
    "59144": "linea",
    "5000": "mantle",
    "25": "cronos",
    "146": "sonic",
    "1329": "sei",
    "747": "flow",
    "999": "hyperliquid",
    "143": "monad",
    "7565164": "solana",
};

interface DexToken {
    address: string;
    symbol: string;
    name: string;
    logoURI?: string;
}

function TokenLogo({
    token,
    size = 32,
}: {
    token: { symbol: string; logoURI?: string };
    size?: number;
}) {
    const [failed, setFailed] = useState(false);
    const sizeClass = size === 24 ? "w-6 h-6" : "w-8 h-8";

    if (token.logoURI && !failed) {
        return (
            <img
                src={token.logoURI}
                alt={token.symbol}
                className={`${sizeClass} rounded-full bg-surface flex-shrink-0`}
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <div
            className={`${sizeClass} rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
        >
            {token.symbol.slice(0, 2)}
        </div>
    );
}

export function TokenSelector({
    chainId,
    value,
    onChange,
    label,
}: TokenSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [dexResults, setDexResults] = useState<DexToken[]>([]);
    const [searching, setSearching] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const tokens = useMemo(() => getTokensForChain(chainId), [chainId]);

    const filteredTokens = useMemo(() => {
        if (!search) return tokens;
        const q = search.toLowerCase();
        return tokens.filter(
            (t) =>
                t.symbol.toLowerCase().includes(q) ||
                t.name.toLowerCase().includes(q) ||
                t.address.toLowerCase().includes(q)
        );
    }, [tokens, search]);

    const selectedToken = useMemo(() => {
        // First check local list
        const local = tokens.find(
            (t) => t.address.toLowerCase() === value.toLowerCase()
        );
        if (local) return local;
        // Check if it's a previously selected DexScreener result
        const dex = dexResults.find(
            (t) => t.address.toLowerCase() === value.toLowerCase()
        );
        if (dex)
            return {
                chainId,
                address: dex.address,
                symbol: dex.symbol,
                name: dex.name,
                decimals: 18,
                logoURI: dex.logoURI,
            } as TokenInfo;
        return undefined;
    }, [tokens, dexResults, value, chainId]);

    // Search DexScreener for tokens on this chain
    const searchDex = useCallback(
        async (q: string) => {
            const dexChain = CHAIN_TO_DEXSCREENER[chainId];
            if (!q.trim() || q.trim().length < 2) {
                setDexResults([]);
                return;
            }

            setSearching(true);
            try {
                const res = await fetch(
                    `/api/dexscreener?q=${encodeURIComponent(q)}`
                );
                if (!res.ok) throw new Error("Search failed");
                const data = await res.json();

                // Filter to only show tokens on the current chain, deduplicate by address
                const seen = new Set<string>();
                const localAddresses = new Set(
                    tokens.map((t) => t.address.toLowerCase())
                );
                const results: DexToken[] = [];

                for (const pair of data.pairs || []) {
                    // If we have a chain mapping, filter to current chain only
                    // If no mapping, show all results
                    if (dexChain && pair.chainId !== dexChain) continue;

                    const addr = pair.baseToken.address.toLowerCase();
                    if (seen.has(addr) || localAddresses.has(addr)) continue;
                    seen.add(addr);

                    results.push({
                        address: pair.baseToken.address,
                        symbol: pair.baseToken.symbol,
                        name: pair.baseToken.name,
                        logoURI: pair.info?.imageUrl || undefined,
                    });

                    if (results.length >= 20) break;
                }

                setDexResults(results);
            } catch {
                setDexResults([]);
            } finally {
                setSearching(false);
            }
        },
        [chainId, tokens]
    );

    // Debounced search
    const handleSearch = useCallback(
        (value: string) => {
            setSearch(value);
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            if (value.trim().length >= 2) {
                searchTimeout.current = setTimeout(
                    () => searchDex(value),
                    400
                );
            } else {
                setDexResults([]);
            }
        },
        [searchDex]
    );

    const isNative = (address: string) =>
        address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

    const handleSelect = useCallback(
        (address: string) => {
            onChange(address);
            setIsOpen(false);
            setSearch("");
        },
        [onChange]
    );

    // Reset search when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearch("");
            setDexResults([]);
        }
    }, [isOpen]);

    return (
        <>
            <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                    {label}
                </label>
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-surface rounded-xl border border-surface-border hover:border-surface-border-light transition-colors text-left"
                >
                    {selectedToken ? (
                        <>
                            <TokenLogo token={selectedToken} size={24} />
                            <span className="flex-1">
                                <span className="text-sm font-medium text-gray-100">
                                    {selectedToken.symbol}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">
                                    {selectedToken.name}
                                </span>
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-500">
                            Select token
                        </span>
                    )}
                    <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>
            </div>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Select Token"
            >
                {/* Search */}
                <div className="p-4 border-b border-surface-border">
                    <div className="relative">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600"
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
                            placeholder="Search any token name, symbol, or paste address..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                            className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl border border-surface-border text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500/50 transition-colors"
                        />
                        {searching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
                    {search.length > 0 && search.length < 2 && (
                        <p className="text-[10px] text-gray-600 mt-1.5 pl-1">
                            Type at least 2 characters to search all tokens...
                        </p>
                    )}
                </div>

                {/* Token List */}
                <div className="py-2 max-h-[400px] overflow-y-auto">
                    {/* Common / hardcoded tokens */}
                    {filteredTokens.length > 0 && (
                        <>
                            {search && dexResults.length > 0 && (
                                <div className="px-4 py-1.5">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">
                                        Popular Tokens
                                    </span>
                                </div>
                            )}
                            {filteredTokens.map((token) => (
                                <button
                                    key={`local-${token.address}`}
                                    onClick={() => handleSelect(token.address)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${token.address.toLowerCase() ===
                                        value.toLowerCase()
                                        ? "bg-brand-500/10"
                                        : "hover:bg-surface-overlay"
                                        }`}
                                >
                                    <TokenLogo token={token} size={32} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-100">
                                                {token.symbol}
                                            </span>
                                            {isNative(token.address) && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-green/10 text-accent-green font-medium">
                                                    NATIVE
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 truncate block">
                                            {token.name}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}

                    {/* DexScreener results */}
                    {dexResults.length > 0 && (
                        <>
                            <div className="px-4 py-1.5 mt-1 border-t border-surface-border/50">
                                <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold flex items-center gap-1.5">
                                    <svg
                                        className="w-3 h-3"
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
                                    Found on DexScreener
                                </span>
                            </div>
                            {dexResults.map((token) => (
                                <button
                                    key={`dex-${token.address}`}
                                    onClick={() => handleSelect(token.address)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${token.address.toLowerCase() ===
                                        value.toLowerCase()
                                        ? "bg-brand-500/10"
                                        : "hover:bg-surface-overlay"
                                        }`}
                                >
                                    <TokenLogo token={token} size={32} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-100">
                                                {token.symbol}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500 truncate block">
                                            {token.name}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-600 font-mono truncate max-w-[100px]">
                                        {token.address.slice(0, 6)}...
                                        {token.address.slice(-4)}
                                    </span>
                                </button>
                            ))}
                        </>
                    )}

                    {/* Loading */}
                    {searching && (
                        <div className="px-4 py-6 text-center">
                            <svg
                                className="animate-spin w-5 h-5 text-brand-400 mx-auto mb-2"
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
                            <p className="text-xs text-gray-500">
                                Searching DexScreener...
                            </p>
                        </div>
                    )}

                    {/* Empty state */}
                    {filteredTokens.length === 0 &&
                        dexResults.length === 0 &&
                        !searching &&
                        search.length >= 2 && (
                            <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                <p>No tokens found</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    Try a different name or paste a contract
                                    address
                                </p>
                            </div>
                        )}
                </div>
            </Modal>
        </>
    );
}
