// src/components/otc/OrderCard.tsx
// Individual OTC order display card
"use client";

import { useMemo } from "react";
import type { OTCOrder } from "@/lib/utils/otcTypes";

// Chain name lookup
const CHAIN_NAMES: Record<string, string> = {
    "1": "Ethereum",
    "56": "BSC",
    "137": "Polygon",
    "43114": "Avalanche",
    "42161": "Arbitrum",
    "10": "Optimism",
    "8453": "Base",
    "59144": "Linea",
    "5000": "Mantle",
    "25": "Cronos",
    "146": "Sonic",
    "1329": "Sei",
    "747": "Flow",
    "1514": "Story",
    "2741": "Abstract",
    "60808": "BOB",
    "999": "HyperEVM",
    "9745": "Plasma",
    "143": "Monad",
    "4326": "MegaETH",
    "7565164": "Solana",
    "sui": "Sui",
    "canton": "Canton",
};

// Chain logo lookup
const CHAIN_LOGOS: Record<string, string> = {
    "1": "/chains/ethereum.png",
    "56": "/chains/bsc.png",
    "137": "/chains/polygon.png",
    "43114": "/chains/avalanche.png",
    "42161": "/chains/arbitrum.png",
    "10": "/chains/optimism.png",
    "8453": "/chains/base.png",
    "59144": "/chains/linea.png",
    "5000": "/chains/mantle.png",
    "25": "/chains/cronos.png",
    "146": "/chains/sonic.png",
    "1329": "/chains/sei.png",
    "747": "/chains/flow.png",
    "1514": "/chains/story.png",
    "2741": "/chains/abstract.png",
    "60808": "/chains/bob.png",
    "999": "/chains/hyperliquid.png",
    "9745": "/chains/plasma.png",
    "143": "/chains/monad.png",
    "4326": "/chains/megaeth.png",
    "7565164": "/chains/solana.png",
    "sui": "/chains/sui.png",
    "canton": "/chains/canton.svg",
};

function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function timeRemaining(expiresAt?: string): string {
    if (!expiresAt) return "No expiry";
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

interface OrderCardProps {
    order: OTCOrder;
    currentAddress?: string;
    onFill: (order: OTCOrder) => void;
    onCancel: (orderId: string) => void;
    loading?: boolean;
}

export function OrderCard({
    order,
    currentAddress,
    onFill,
    onCancel,
    loading,
}: OrderCardProps) {
    const isMaker =
        currentAddress &&
        order.maker.toLowerCase() === currentAddress.toLowerCase();

    const impliedPrice = useMemo(() => {
        const sell = parseFloat(order.sellAmount);
        const buy = parseFloat(order.buyAmount);
        if (sell === 0 || buy === 0) return "—";
        const price = buy / sell;
        return price >= 1 ? price.toFixed(2) : price.toFixed(6);
    }, [order.sellAmount, order.buyAmount]);

    const statusColor = {
        OPEN: "text-emerald-400",
        FILLED: "text-blue-400",
        CANCELLED: "text-gray-500",
        EXPIRED: "text-amber-400",
    }[order.status];

    const statusBg = {
        OPEN: "bg-emerald-400/10 border-emerald-400/20",
        FILLED: "bg-blue-400/10 border-blue-400/20",
        CANCELLED: "bg-gray-500/10 border-gray-500/20",
        EXPIRED: "bg-amber-400/10 border-amber-400/20",
    }[order.status];

    const sellChainName = CHAIN_NAMES[order.sellChainId] || `Chain ${order.sellChainId}`;
    const sellChainLogo = CHAIN_LOGOS[order.sellChainId];

    return (
        <div className="bg-surface-raised rounded-xl border border-surface-border hover:border-surface-border-light transition-all duration-200 overflow-hidden group">
            {/* Header */}
            <div className="px-4 py-3 border-b border-surface-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Maker avatar */}
                    <div
                        className="w-6 h-6 rounded-full"
                        style={{
                            background: `linear-gradient(135deg, hsl(${parseInt(order.maker.slice(2, 6), 16) % 360
                                }, 70%, 60%), hsl(${(parseInt(order.maker.slice(6, 10), 16) % 360)
                                }, 70%, 40%))`,
                        }}
                    />
                    <span className="text-xs text-gray-400 font-mono">
                        {isMaker ? (
                            <span className="text-brand-400">You</span>
                        ) : (
                            shortenAddress(order.maker)
                        )}
                    </span>
                </div>
                <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${statusBg} ${statusColor}`}
                >
                    {order.status}
                </span>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-3">
                {/* Selling */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        Selling
                    </span>
                    <div className="flex items-center gap-2">
                        {sellChainLogo && (
                            <img
                                src={sellChainLogo}
                                alt=""
                                className="w-4 h-4 rounded-full"
                            />
                        )}
                        <span className="text-sm font-bold text-gray-100">
                            {parseFloat(order.sellAmount).toLocaleString()}{" "}
                            <span className="text-brand-400">
                                {order.sellTokenSymbol}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Arrow */}
                <div className="flex justify-center">
                    <svg
                        className="w-4 h-4 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                        />
                    </svg>
                </div>

                {/* Wanting */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                        For
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-100">
                            {parseFloat(order.buyAmount).toLocaleString()}{" "}
                            <span className="text-emerald-400">
                                {order.buyTokenSymbol}
                            </span>
                        </span>
                    </div>
                </div>

                {/* Rate */}
                <div className="bg-surface/50 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">Rate</span>
                    <span className="text-xs text-gray-300">
                        1 {order.sellTokenSymbol} = {impliedPrice}{" "}
                        {order.buyTokenSymbol}
                    </span>
                </div>

                {/* Chain & Expiry */}
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>{sellChainName}</span>
                    <span
                        className={
                            order.expiresAt &&
                                new Date(order.expiresAt).getTime() - Date.now() <
                                3600000
                                ? "text-amber-400"
                                : ""
                        }
                    >
                        ⏱ {timeRemaining(order.expiresAt)}
                    </span>
                </div>

                {/* Private deal badge */}
                {order.allowedTaker && (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5 text-[10px] text-purple-300 flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Private deal for {shortenAddress(order.allowedTaker)}
                    </div>
                )}
            </div>

            {/* Actions */}
            {order.status === "OPEN" && (
                <div className="px-4 pb-4">
                    {isMaker ? (
                        <button
                            onClick={() => onCancel(order.id)}
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? "Cancelling…" : "Cancel & Refund"}
                        </button>
                    ) : (
                        <button
                            onClick={() => onFill(order)}
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-400 hover:to-brand-500 shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? "Processing…" : "Fill Order"}
                        </button>
                    )}
                </div>
            )}

            {/* Filled info */}
            {order.status === "FILLED" && order.fillTxHash && (
                <div className="px-4 pb-4">
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg px-3 py-2 text-[10px] text-blue-300">
                        ✓ Filled by {shortenAddress(order.taker || "")}{" "}
                        <span className="text-gray-500">
                            • {new Date(order.filledAt || "").toLocaleDateString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
