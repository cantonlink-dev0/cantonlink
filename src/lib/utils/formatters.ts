// src/lib/utils/formatters.ts
// Formatting utilities for numbers, addresses, and tokens

/**
 * Truncate an address for display: 0x1234...abcd
 */
export function truncateAddress(address: string, chars = 4): string {
    if (!address) return "";
    if (address.length <= chars * 2 + 2) return address;
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a token amount with specified decimals for display.
 */
export function formatTokenAmount(
    amount: string | number,
    displayDecimals = 6
): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "0";
    if (num === 0) return "0";
    if (num < 0.000001) return "< 0.000001";
    return num.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: displayDecimals,
    });
}

/**
 * Format USD value for display.
 */
export function formatUsd(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Convert basis points to percentage string.
 */
export function bpsToPercent(bps: number): string {
    return `${(bps / 100).toFixed(2)}%`;
}

/**
 * Format seconds into human-readable ETA.
 */
export function formatEta(seconds: number): string {
    if (seconds < 60) return `~${seconds}s`;
    if (seconds < 3600) return `~${Math.ceil(seconds / 60)}min`;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.ceil((seconds % 3600) / 60);
    return `~${hours}h ${mins}min`;
}

/**
 * Parse a raw token amount (bigint-style string) into a human-readable number.
 */
export function fromRawAmount(raw: string, decimals: number): string {
    if (!raw || raw === "0") return "0";
    const padded = raw.padStart(decimals + 1, "0");
    const intPart = padded.slice(0, padded.length - decimals) || "0";
    const decPart = padded.slice(padded.length - decimals);
    const trimmed = decPart.replace(/0+$/, "");
    return trimmed ? `${intPart}.${trimmed}` : intPart;
}

/**
 * Convert a human-readable amount to raw bigint string.
 */
export function toRawAmount(amount: string, decimals: number): string {
    const [intPart, decPart = ""] = amount.split(".");
    const paddedDec = decPart.padEnd(decimals, "0").slice(0, decimals);
    const raw = intPart + paddedDec;
    return raw.replace(/^0+/, "") || "0";
}
