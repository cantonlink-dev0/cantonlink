// src/components/otc/OTCApp.tsx
// Main orchestrator for OTC/P2P trading feature
"use client";

import { useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useSession } from "@cantonconnect/react";
import { CreateOrder } from "@/components/otc/CreateOrder";
import { OrderBook } from "@/components/otc/OrderBook";
import { FillOrderModal } from "@/components/otc/FillOrderModal";
import { useOTCOrders } from "@/lib/hooks/useOTCOrders";
import type { OTCOrder } from "@/lib/utils/otcTypes";

type OTCView = "book" | "create";

export function OTCApp() {
    const [view, setView] = useState<OTCView>("book");
    const [fillTarget, setFillTarget] = useState<OTCOrder | null>(null);

    // EVM wallet
    const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
    const { openConnectModal } = useConnectModal();

    // Canton wallet — use partyId as the "address" for Canton orders
    const cantonSession = useSession();
    const cantonPartyId = cantonSession?.partyId;

    // Use Canton identity if connected, otherwise EVM
    const address = cantonPartyId ?? evmAddress;
    const isConnected = !!cantonPartyId || isEvmConnected;

    const {
        orders,
        openOrders,
        loading,
        error,
        createOrder,
        fillOrder,
        cancelOrder,
        clearError,
    } = useOTCOrders();

    // Handle create order
    const handleCreateOrder = useCallback(
        async (params: any) => {
            if (!address) {
                // Prompt the right wallet type
                if (cantonPartyId === undefined && !isEvmConnected) {
                    openConnectModal?.();
                }
                return null;
            }
            const result = await createOrder(params, address);
            if (result) {
                // Switch to order book to see the new order
                setTimeout(() => setView("book"), 1500);
            }
            return result;
        },
        [address, cantonPartyId, isEvmConnected, createOrder, openConnectModal]
    );

    // Handle fill order
    const handleFill = useCallback(
        async () => {
            if (!fillTarget || !address) return;
            const success = await fillOrder(fillTarget.id, address);
            if (success) {
                setFillTarget(null);
            }
        },
        [fillTarget, address, fillOrder]
    );

    // Handle cancel order
    const handleCancel = useCallback(
        async (orderId: string) => {
            if (!address) return;
            await cancelOrder(orderId, address);
        },
        [address, cancelOrder]
    );

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-surface-border">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-bold text-gray-100">
                            P2P Trading
                        </h1>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Escrow Protected
                        </div>
                    </div>
                </div>

                {/* View toggle */}
                <div className="px-6 pt-5">
                    <div className="flex gap-1 bg-surface rounded-xl p-1 border border-surface-border">
                        <button
                            onClick={() => setView("book")}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${view === "book"
                                ? "bg-brand-500/20 text-brand-300 shadow-sm"
                                : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
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
                                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                                    />
                                </svg>
                                Order Book
                                {openOrders.length > 0 && (
                                    <span className="text-[10px] bg-brand-500/30 text-brand-300 rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                                        {openOrders.length}
                                    </span>
                                )}
                            </span>
                        </button>
                        <button
                            onClick={() => setView("create")}
                            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${view === "create"
                                ? "bg-brand-500/20 text-brand-300 shadow-sm"
                                : "text-gray-500 hover:text-gray-300"
                                }`}
                        >
                            <span className="flex items-center justify-center gap-1.5">
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
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Create Order
                            </span>
                        </button>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mx-6 mt-4">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
                            <p className="text-sm text-red-400">{error}</p>
                            <button
                                onClick={clearError}
                                className="text-red-400/60 hover:text-red-400 transition-colors"
                            >
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
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="px-6 py-5">
                    {view === "book" ? (
                        <OrderBook
                            orders={orders}
                            currentAddress={address}
                            onFill={setFillTarget}
                            onCancel={handleCancel}
                            loading={loading}
                        />
                    ) : (
                        <CreateOrder
                            onSubmit={handleCreateOrder}
                            loading={loading}
                            isConnected={isConnected}
                        />
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                    Escrow-protected P2P trading • Atomic swaps
                </p>
            </div>

            {/* Fill order modal */}
            {fillTarget && (
                <FillOrderModal
                    order={fillTarget}
                    onConfirm={handleFill}
                    onClose={() => setFillTarget(null)}
                    loading={loading}
                />
            )}
        </div>
    );
}
