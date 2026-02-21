// src/components/otc/CreateOrder.tsx
// Form to create a new P2P order with escrow
"use client";

import { useState, useMemo } from "react";
import { ChainSelector } from "@/components/ChainSelector";
import { TokenSelector } from "@/components/TokenSelector";
import { AmountInput } from "@/components/AmountInput";
import { findToken, getTokensForChain } from "@/lib/tokens/tokenList";
import { NATIVE_TOKEN_ADDRESS } from "@/lib/utils/constants";
import type { CreateOrderParams } from "@/lib/utils/otcTypes";

interface CreateOrderProps {
    onSubmit: (params: CreateOrderParams) => Promise<any>;
    loading: boolean;
    isConnected: boolean;
}

export function CreateOrder({ onSubmit, loading, isConnected }: CreateOrderProps) {
    const [sellChainId, setSellChainId] = useState("1");
    const [sellTokenAddress, setSellTokenAddress] = useState(NATIVE_TOKEN_ADDRESS);
    const [sellAmount, setSellAmount] = useState("");
    const [buyChainId, setBuyChainId] = useState("1");
    const [buyTokenAddress, setBuyTokenAddress] = useState(
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    );
    const [buyAmount, setBuyAmount] = useState("");
    const [expiryHours, setExpiryHours] = useState("24");
    const [allowedTaker, setAllowedTaker] = useState("");
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [success, setSuccess] = useState(false);

    const sellToken = useMemo(
        () => findToken(sellChainId, sellTokenAddress),
        [sellChainId, sellTokenAddress]
    );
    const buyToken = useMemo(
        () => findToken(buyChainId, buyTokenAddress),
        [buyChainId, buyTokenAddress]
    );

    // Reset token when chain changes
    const handleSellChainChange = (id: string) => {
        setSellChainId(id);
        const tokens = getTokensForChain(id);
        if (tokens.length > 0) setSellTokenAddress(tokens[0].address);
    };

    const handleBuyChainChange = (id: string) => {
        setBuyChainId(id);
        const tokens = getTokensForChain(id);
        if (tokens.length > 0) setBuyTokenAddress(tokens[0].address);
    };

    const canSubmit =
        isConnected &&
        sellAmount !== "" &&
        parseFloat(sellAmount) > 0 &&
        buyAmount !== "" &&
        parseFloat(buyAmount) > 0;

    const handleSubmit = async () => {
        if (!canSubmit || !sellToken || !buyToken) return;

        const result = await onSubmit({
            sellChainId,
            sellTokenAddress,
            sellTokenSymbol: sellToken.symbol,
            sellTokenDecimals: sellToken.decimals,
            sellAmount,
            buyChainId,
            buyTokenAddress,
            buyTokenSymbol: buyToken.symbol,
            buyTokenDecimals: buyToken.decimals,
            buyAmount,
            expiresInHours: expiryHours ? parseInt(expiryHours) : undefined,
            allowedTaker: allowedTaker || undefined,
        });

        if (result) {
            setSuccess(true);
            setSellAmount("");
            setBuyAmount("");
            setAllowedTaker("");
            setTimeout(() => setSuccess(false), 3000);
        }
    };

    return (
        <div className="space-y-5">
            {/* Escrow info banner */}
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3 flex items-start gap-3">
                <svg
                    className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5"
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
                <div>
                    <p className="text-sm font-medium text-emerald-300">
                        Escrow Protected
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Your tokens will be locked in escrow until someone fills
                        your order. Cancel anytime for a full refund.
                    </p>
                </div>
            </div>

            {/* I'm Selling */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    I&apos;m Selling
                </label>
                <div className="bg-surface rounded-xl border border-surface-border p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <ChainSelector
                            value={sellChainId}
                            onChange={handleSellChainChange}
                            label="Chain"
                        />
                        <TokenSelector
                            chainId={sellChainId}
                            value={sellTokenAddress}
                            onChange={setSellTokenAddress}
                            label="Token"
                        />
                    </div>
                    <AmountInput
                        value={sellAmount}
                        onChange={setSellAmount}
                        label="Amount"
                        tokenSymbol={sellToken?.symbol}
                    />
                </div>
            </div>

            {/* Swap arrow */}
            <div className="flex justify-center">
                <div className="p-2 rounded-xl bg-surface border border-surface-border">
                    <svg
                        className="w-5 h-5 text-gray-400"
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

            {/* I Want */}
            <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    I Want
                </label>
                <div className="bg-surface rounded-xl border border-surface-border p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <ChainSelector
                            value={buyChainId}
                            onChange={handleBuyChainChange}
                            label="Chain"
                        />
                        <TokenSelector
                            chainId={buyChainId}
                            value={buyTokenAddress}
                            onChange={setBuyTokenAddress}
                            label="Token"
                        />
                    </div>
                    <AmountInput
                        value={buyAmount}
                        onChange={setBuyAmount}
                        label="Amount"
                        tokenSymbol={buyToken?.symbol}
                    />
                </div>
            </div>

            {/* Advanced options toggle */}
            <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
                <svg
                    className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-90" : ""
                        }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                    />
                </svg>
                Advanced Options
            </button>

            {showAdvanced && (
                <div className="space-y-3 animate-fade-in">
                    {/* Expiry */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-gray-500">
                            Expires In
                        </label>
                        <select
                            value={expiryHours}
                            onChange={(e) => setExpiryHours(e.target.value)}
                            className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-brand-500/50"
                        >
                            <option value="1">1 hour</option>
                            <option value="6">6 hours</option>
                            <option value="24">24 hours</option>
                            <option value="48">48 hours</option>
                            <option value="168">7 days</option>
                            <option value="">No expiry</option>
                        </select>
                    </div>

                    {/* Private deal */}
                    <div className="space-y-1.5">
                        <label className="text-xs text-gray-500">
                            Restrict to Address (Private Deal)
                        </label>
                        <input
                            type="text"
                            value={allowedTaker}
                            onChange={(e) => setAllowedTaker(e.target.value)}
                            placeholder="0x... (leave empty for public)"
                            className="w-full bg-surface border border-surface-border rounded-xl px-3 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500/50 font-mono"
                        />
                    </div>
                </div>
            )}

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-400 hover:to-brand-500 shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        Depositing to Escrow…
                    </span>
                ) : !isConnected ? (
                    "Connect Wallet First"
                ) : !canSubmit ? (
                    "Enter Amounts"
                ) : (
                    "Create Order & Lock in Escrow"
                )}
            </button>

            {/* Success message */}
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-300 text-center animate-fade-in">
                    ✓ Order created! Tokens locked in escrow. Visible in the
                    Order Book.
                </div>
            )}
        </div>
    );
}
