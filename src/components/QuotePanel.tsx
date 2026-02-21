// src/components/QuotePanel.tsx
"use client";

import type { Route, RoutingError } from "@/lib/schemas/route";
import type { Mode } from "@/lib/utils/constants";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { formatTokenAmount, formatEta, bpsToPercent } from "@/lib/utils/formatters";

interface QuotePanelProps {
    quote: Route | null;
    error: RoutingError | null;
    loading: boolean;
    mode: Mode;
}

export function QuotePanel({ quote, error, loading, mode }: QuotePanelProps) {
    if (loading) {
        return (
            <div className="bg-surface-raised rounded-xl border border-surface-border p-6 animate-pulse-slow">
                <div className="flex items-center justify-center gap-3 text-gray-400">
                    <Spinner size="sm" />
                    <span className="text-sm">Fetching best route...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-accent-red/5 rounded-xl border border-accent-red/20 p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                    <svg
                        className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-accent-red">{error.message}</p>
                        {error.code && (
                            <p className="text-xs text-gray-500 mt-1">Code: {error.code}</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (!quote) return null;

    return (
        <div className="bg-surface-raised rounded-xl border border-surface-border overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="px-4 py-3 border-b border-surface-border bg-surface-overlay/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">Quote</span>
                        <Badge color={mode === "AUTO" ? "#6366f1" : mode === "SWAP_ONLY" ? "#10b981" : "#3b82f6"}>
                            {mode}
                        </Badge>
                    </div>
                    <Badge color="#6366f1">{quote.provider}</Badge>
                </div>
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
                {/* Route reason */}
                {quote.routeReason && (
                    <div className="flex items-start gap-2 text-xs text-gray-400 bg-brand-500/5 rounded-lg px-3 py-2 border border-brand-500/10">
                        <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-brand-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                        </svg>
                        <span>{quote.routeReason}</span>
                    </div>
                )}

                {/* Min received */}
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">You receive (min)</span>
                    <span className="text-sm font-mono font-medium text-accent-green">
                        {formatTokenAmount(quote.toAmountMin)} {quote.toToken.symbol}
                    </span>
                </div>

                {/* Exchange rate */}
                {quote.exchangeRate && (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Rate</span>
                        <span className="text-sm font-mono text-gray-300">
                            1 {quote.fromToken.symbol} ≈ {formatTokenAmount(quote.exchangeRate)}{" "}
                            {quote.toToken.symbol}
                        </span>
                    </div>
                )}

                {/* Price impact */}
                {quote.priceImpact !== undefined && (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Price impact</span>
                        <span
                            className={`text-sm font-mono ${quote.priceImpact > 3
                                    ? "text-accent-red"
                                    : quote.priceImpact > 1
                                        ? "text-accent-yellow"
                                        : "text-accent-green"
                                }`}
                        >
                            {quote.priceImpact.toFixed(2)}%
                        </span>
                    </div>
                )}

                {/* ETA */}
                {quote.etaSeconds && (
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Estimated time</span>
                        <span className="text-sm text-gray-300">
                            {formatEta(quote.etaSeconds)}
                        </span>
                    </div>
                )}

                {/* Fees */}
                {quote.fees && quote.fees.length > 0 && (
                    <div className="pt-2 border-t border-surface-border">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fees
                        </span>
                        {quote.fees.map((fee, i) => (
                            <div key={i} className="flex justify-between items-center mt-1.5">
                                <span className="text-xs text-gray-400">{fee.name}</span>
                                <span className="text-xs font-mono text-gray-300">
                                    {fee.amount} {fee.token}
                                    {fee.amountUsd !== undefined && (
                                        <span className="text-gray-500 ml-1">(${fee.amountUsd.toFixed(2)})</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Route steps summary */}
                {quote.steps && quote.steps.length > 0 && (
                    <div className="pt-2 border-t border-surface-border">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Route Steps
                        </span>
                        <div className="mt-2 space-y-1.5">
                            {quote.steps.map((step, i) => (
                                <div key={step.id} className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-surface-overlay border border-surface-border flex items-center justify-center text-[10px] text-gray-400 font-medium">
                                        {i + 1}
                                    </span>
                                    <span className="text-xs text-gray-300">{step.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
