// src/lib/store/otcStore.ts
// localStorage persistence for OTC/P2P orders — production version (no mock data)

import type { OTCOrder, OTCOrderStatus } from "@/lib/utils/otcTypes";

const STORAGE_KEY = "omnidex_otc_orders";

/** Load all orders from localStorage */
export function loadOrders(): OTCOrder[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const orders = JSON.parse(raw) as OTCOrder[];
        // Auto-expire orders
        const now = new Date().toISOString();
        return orders.map((o) => {
            if (o.status === "OPEN" && o.expiresAt && o.expiresAt < now) {
                return { ...o, status: "EXPIRED" as OTCOrderStatus };
            }
            return o;
        });
    } catch {
        return [];
    }
}

/** Save all orders to localStorage */
export function saveOrders(orders: OTCOrder[]): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch {
        console.warn("Failed to save OTC orders to localStorage");
    }
}

/** Generate a unique order ID */
export function generateOrderId(): string {
    return `otc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
