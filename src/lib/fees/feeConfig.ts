// src/lib/fees/feeConfig.ts
// CantonLink fee structure and configuration

export const FEE_CONFIG = {
    // Fee percentages (in basis points for precision)
    SWAP_FEE_BPS: 10, // 0.10% = 10 basis points
    BRIDGE_FEE_BPS: 15, // 0.15% = 15 basis points
    OTC_FEE_BPS: 25, // 0.25% per side = 25 basis points

    // Fee wallet addresses (multi-sig recommended for production)
    FEE_WALLET_EVM: "0xaD0adD0A40728C5c5e22968e466354CcCCBff60f",
    FEE_WALLET_SOLANA: "9G313dAq8BWiihoR166NhgYYfM4Bf5zjnRL8yqGaHYvK",
    FEE_WALLET_SUI: "0xa52bd04a6cd07441179f8ff0a37368528b2226b7346774c935934229032edcc5",

    // Canton fee — flat fee in Canton Coin (CC) per Canton transaction
    CANTON_FEE_CC: 0.01,
    // Canton party receiving fees (set to your Canton party ID)
    FEE_WALLET_CANTON: "Alice", // Update to your production Canton party ID

    // Partner/Integrator codes for revenue share
    INTEGRATOR_CODES: {
        PARASWAP: "cantonlink", // ParaSwap/Velora integrator ID
        JUPITER: "CantonLink", // Jupiter referral account
        LIFI: "cantonlink", // LI.FI integrator string
        ONEINCH: "cantonlink", // 1inch referral code
    },
} as const;

/**
 * Calculate fee amount in basis points
 * @param amount - Original amount
 * @param feeBps - Fee in basis points (1 bps = 0.01%)
 * @returns Fee amount
 */
export function calculateFee(amount: number, feeBps: number): number {
    return (amount * feeBps) / 10000;
}

/**
 * Calculate amount after fee deduction
 * @param amount - Original amount
 * @param feeBps - Fee in basis points
 * @returns Amount after fee
 */
export function getAmountAfterFee(amount: number, feeBps: number): number {
    const fee = calculateFee(amount, feeBps);
    return amount - fee;
}

/**
 * Get fee percentage as human-readable string
 * @param feeBps - Fee in basis points
 * @returns Percentage string (e.g., "0.10%")
 */
export function getFeePercentage(feeBps: number): string {
    return `${(feeBps / 100).toFixed(2)}%`;
}

/**
 * Fee breakdown for display
 */
export interface FeeBreakdown {
    originalAmount: number;
    feeAmount: number;
    feePercentage: string;
    amountAfterFee: number;
    feeType: "swap" | "bridge" | "otc";
}

/**
 * Get complete fee breakdown for a transaction
 */
export function getFeeBreakdown(
    amount: number,
    type: "swap" | "bridge" | "otc"
): FeeBreakdown {
    const feeBps =
        type === "swap"
            ? FEE_CONFIG.SWAP_FEE_BPS
            : type === "bridge"
                ? FEE_CONFIG.BRIDGE_FEE_BPS
                : FEE_CONFIG.OTC_FEE_BPS;

    const feeAmount = calculateFee(amount, feeBps);
    const amountAfterFee = amount - feeAmount;

    return {
        originalAmount: amount,
        feeAmount,
        feePercentage: getFeePercentage(feeBps),
        amountAfterFee,
        feeType: type,
    };
}
