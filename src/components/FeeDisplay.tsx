"use client";

import { FEE_CONFIG, getFeeBreakdown } from "@/lib/fees/feeConfig";
import type { FeeBreakdown } from "@/lib/fees/feeConfig";

interface FeeDisplayProps {
    amount: number;
    type: "swap" | "bridge" | "otc";
    tokenSymbol?: string;
}

export function FeeDisplay({ amount, type, tokenSymbol = "USD" }: FeeDisplayProps) {
    const breakdown = getFeeBreakdown(amount, type);

    return (
        <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
                <span>Amount</span>
                <span>
                    {breakdown.originalAmount.toFixed(6)} {tokenSymbol}
                </span>
            </div>

            <div className="flex justify-between text-amber-400">
                <span>CantonLink Fee ({breakdown.feePercentage})</span>
                <span>
                    -{breakdown.feeAmount.toFixed(6)} {tokenSymbol}
                </span>
            </div>

            <div className="flex justify-between text-white font-semibold pt-2 border-t border-gray-700">
                <span>You Receive</span>
                <span>
                    {breakdown.amountAfterFee.toFixed(6)} {tokenSymbol}
                </span>
            </div>

            <div className="text-xs text-gray-500 mt-2">
                {type === "swap" && "Platform fees may apply from aggregators"}
                {type === "bridge" && "Additional platform & gas fees may apply"}
                {type === "otc" && "Both maker and taker pay this fee"}
            </div>
        </div>
    );
}

interface FeeTooltipTextProps {
    type: "swap" | "bridge" | "otc";
}

export function FeeTooltipText({ type }: FeeTooltipTextProps) {
    const feePercent =
        type === "swap"
            ? "0.10%"
            : type === "bridge"
                ? "0.15%"
                : "0.25%";

    return (
        <div className="text-xs space-y-1">
            <div className="font-semibold">CantonLink Fee: {feePercent}</div>
            <div className="text-gray-300">
                {type === "swap" &&
                    "Deducted from source token before swap. We also earn revenue share from aggregators."}
                {type === "bridge" &&
                    "Deducted from source token before bridging. Separate from platform bridge fees."}
                {type === "otc" &&
                    "Each party pays 0.25%. Total 0.50% split between maker and taker."}
            </div>
        </div>
    );
}
