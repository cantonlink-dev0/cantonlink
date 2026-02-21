// src/lib/hooks/usePersistedRoute.ts
// Hook: resume tracking from localStorage after refresh
"use client";

import { useState, useEffect } from "react";
import { getActiveRoutes } from "@/lib/store/transactionStore";
import type { PersistedRoute } from "@/lib/schemas/status";

/**
 * On mount, loads any in-flight routes from localStorage and returns them.
 * The calling component can use this to resume bridge status polling.
 */
export function usePersistedRoute(): {
    persistedRoutes: PersistedRoute[];
    loading: boolean;
} {
    const [persistedRoutes, setPersistedRoutes] = useState<PersistedRoute[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const routes = getActiveRoutes();
        // Only return routes that are still in-flight
        const inflight = routes.filter(
            (r) => r.status !== "COMPLETED" && r.status !== "FAILED"
        );
        setPersistedRoutes(inflight);
        setLoading(false);
    }, []);

    return { persistedRoutes, loading };
}
