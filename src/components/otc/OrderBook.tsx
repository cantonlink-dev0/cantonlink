// src/components/otc/OrderBook.tsx
// Displays all active P2P orders
"use client";

import { useState, useMemo } from "react";
import { OrderCard } from "@/components/otc/OrderCard";
import type { OTCOrder, OTCOrderStatus } from "@/lib/utils/otcTypes";

interface OrderBookProps {
    orders: OTCOrder[];
    currentAddress?: string;
    onFill: (order: OTCOrder) => void;
    onCancel: (orderId: string) => void;
    loading: boolean;
}

const STATUS_FILTERS: { label: string; value: OTCOrderStatus | "ALL" | "MY" }[] = [
    { label: "All Open", value: "ALL" },
    { label: "My Orders", value: "MY" },
    { label: "Filled", value: "FILLED" },
    { label: "Cancelled", value: "CANCELLED" },
];

export function OrderBook({
    orders,
    currentAddress,
    onFill,
    onCancel,
    loading,
}: OrderBookProps) {
    const [filter, setFilter] = useState<OTCOrderStatus | "ALL" | "MY">("ALL");
    const [searchTerm, setSearchTerm] = useState("");

    const filteredOrders = useMemo(() => {
        let result = orders;

        // Status filter
        if (filter === "ALL") {
            result = result.filter((o) => o.status === "OPEN");
        } else if (filter === "MY" && currentAddress) {
            result = result.filter(
                (o) =>
                    o.maker.toLowerCase() === currentAddress.toLowerCase()
            );
        } else if (filter === "FILLED" || filter === "CANCELLED") {
            result = result.filter((o) => o.status === filter);
        }

        // Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (o) =>
                    o.sellTokenSymbol.toLowerCase().includes(term) ||
                    o.buyTokenSymbol.toLowerCase().includes(term) ||
                    o.maker.toLowerCase().includes(term)
            );
        }

        return result;
    }, [orders, filter, currentAddress, searchTerm]);

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${filter === f.value
                                ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                                : "text-gray-500 hover:text-gray-300 border border-transparent"
                            }`}
                    >
                        {f.label}
                        {f.value === "ALL" && (
                            <span className="ml-1.5 text-[10px] opacity-60">
                                {orders.filter((o) => o.status === "OPEN").length}
                            </span>
                        )}
                        {f.value === "MY" && currentAddress && (
                            <span className="ml-1.5 text-[10px] opacity-60">
                                {
                                    orders.filter(
                                        (o) =>
                                            o.maker.toLowerCase() ===
                                            currentAddress.toLowerCase()
                                    ).length
                                }
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by token or address..."
                    className="w-full bg-surface border border-surface-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500/50"
                />
            </div>

            {/* Order grid */}
            {filteredOrders.length > 0 ? (
                <div className="grid gap-3">
                    {filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            currentAddress={currentAddress}
                            onFill={onFill}
                            onCancel={onCancel}
                            loading={loading}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-surface border border-surface-border flex items-center justify-center mb-4">
                        <svg
                            className="w-8 h-8 text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500">
                        {filter === "MY"
                            ? "You haven't created any orders yet"
                            : "No orders found"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        {filter === "ALL"
                            ? "Create an order to get started"
                            : "Try a different filter"}
                    </p>
                </div>
            )}
        </div>
    );
}
