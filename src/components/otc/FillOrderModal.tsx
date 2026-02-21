// src/components/otc/FillOrderModal.tsx
// Confirmation modal before filling an OTC order
"use client";

import { useState } from "react";
import type { OTCOrder } from "@/lib/utils/otcTypes";

interface FillOrderModalProps {
    order: OTCOrder;
    onConfirm: () => void;
    onClose: () => void;
    loading: boolean;
}

function shortenAddress(addr: string): string {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function FillOrderModal({
    order,
    onConfirm,
    onClose,
    loading,
}: FillOrderModalProps) {
    const [agreed, setAgreed] = useState(false);

    const impliedPrice =
        parseFloat(order.buyAmount) / parseFloat(order.sellAmount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-surface-raised rounded-2xl border border-surface-border shadow-2xl overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-100">
                        Confirm Trade
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-300 transition-colors"
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

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Escrow badge */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <svg
                                className="w-4 h-4 text-emerald-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-emerald-300">
                                Escrow Protected
                            </p>
                            <p className="text-xs text-emerald-300/70 mt-0.5">
                                Both tokens swap atomically. You either get the
                                full amount or nothing happens.
                            </p>
                        </div>
                    </div>

                    {/* Trade details */}
                    <div className="space-y-3">
                        <div className="bg-surface rounded-xl px-4 py-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    You Send
                                </span>
                                <span className="text-base font-bold text-gray-100">
                                    {parseFloat(
                                        order.buyAmount
                                    ).toLocaleString()}{" "}
                                    <span className="text-emerald-400">
                                        {order.buyTokenSymbol}
                                    </span>
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-surface border border-surface-border flex items-center justify-center">
                                <svg
                                    className="w-4 h-4 text-gray-400"
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
                            </div>
                        </div>

                        <div className="bg-surface rounded-xl px-4 py-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                    You Receive
                                </span>
                                <span className="text-base font-bold text-gray-100">
                                    {parseFloat(
                                        order.sellAmount
                                    ).toLocaleString()}{" "}
                                    <span className="text-brand-400">
                                        {order.sellTokenSymbol}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-gray-400">
                            <span>Rate</span>
                            <span className="text-gray-300">
                                1 {order.sellTokenSymbol} ={" "}
                                {impliedPrice >= 1
                                    ? impliedPrice.toFixed(2)
                                    : impliedPrice.toFixed(6)}{" "}
                                {order.buyTokenSymbol}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Maker</span>
                            <span className="text-gray-300 font-mono">
                                {shortenAddress(order.maker)}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Settlement</span>
                            <span className="text-emerald-400">
                                Atomic Swap (Escrow)
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Network Fee</span>
                            <span className="text-gray-300">~$0.50</span>
                        </div>
                    </div>

                    {/* Checkbox */}
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-gray-600 bg-surface text-brand-500 focus:ring-brand-500/30 focus:ring-offset-0"
                        />
                        <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                            I understand this trade is final and will be settled
                            atomically through escrow. Tokens will be exchanged
                            in a single transaction.
                        </span>
                    </label>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface border border-surface-border text-gray-400 hover:text-gray-200 hover:border-surface-border-light transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!agreed || loading}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-400 hover:to-brand-500 shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg
                                    className="animate-spin w-4 h-4"
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
                                Executing…
                            </span>
                        ) : (
                            "Confirm & Fill"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
