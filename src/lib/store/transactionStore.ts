// src/lib/store/transactionStore.ts
// localStorage persistence for active routes (+resume tracking)

import { PersistedRouteSchema, type PersistedRoute } from "@/lib/schemas/status";
import type { StatusState } from "@/lib/utils/constants";
import { LOCAL_STORAGE_KEYS } from "@/lib/utils/constants";

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

/** Get all persisted active routes. */
export function getActiveRoutes(): PersistedRoute[] {
    if (!isBrowser()) return [];
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_ROUTES);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .flatMap((r: unknown) => {
                const result = PersistedRouteSchema.safeParse(r);
                return result.success ? [result.data] : [];
            });
    } catch {
        return [];
    }
}

/** Persist a route. */
export function saveRoute(route: PersistedRoute): void {
    if (!isBrowser()) return;
    const routes = getActiveRoutes();
    const existing = routes.findIndex((r) => r.routeId === route.routeId);
    if (existing >= 0) {
        routes[existing] = route;
    } else {
        routes.push(route);
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_ROUTES, JSON.stringify(routes));
}

/** Update the status of a persisted route. */
export function updateRouteStatus(
    routeId: string,
    status: StatusState,
    updates?: Partial<PersistedRoute>
): void {
    if (!isBrowser()) return;
    const routes = getActiveRoutes();
    const idx = routes.findIndex((r) => r.routeId === routeId);
    if (idx < 0) return;
    routes[idx] = {
        ...routes[idx],
        ...updates,
        status,
        updatedAt: Date.now(),
    };
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_ROUTES, JSON.stringify(routes));
}

/** Remove a completed/failed route. */
export function removeRoute(routeId: string): void {
    if (!isBrowser()) return;
    const routes = getActiveRoutes().filter((r) => r.routeId !== routeId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_ROUTES, JSON.stringify(routes));
}

/** Get persisted mode preference. */
export function getPersistedMode(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(LOCAL_STORAGE_KEYS.MODE);
}

/** Save mode preference. */
export function setPersistedMode(mode: string): void {
    if (!isBrowser()) return;
    localStorage.setItem(LOCAL_STORAGE_KEYS.MODE, mode);
}
