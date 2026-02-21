// src/components/SwapBridgeApp.tsx
// Main single-screen orchestrator for the Swap + Bridge dApp
// Supports walletless flow: users can get quotes and specify a recipient address
// without connecting a wallet (like SimpleSwap).
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ModeToggle } from "@/components/ModeToggle";
import { ChainSelector } from "@/components/ChainSelector";
import { TokenSelector } from "@/components/TokenSelector";
import { AmountInput } from "@/components/AmountInput";
import { QuotePanel } from "@/components/QuotePanel";
import { TransactionStepper } from "@/components/TransactionStepper";
import { Button } from "@/components/ui/Button";
import { useQuote } from "@/lib/hooks/useQuote";
import { useSwapExecution } from "@/lib/hooks/useSwapExecution";
import { useBridgeExecution } from "@/lib/hooks/useBridgeExecution";
import { usePersistedRoute } from "@/lib/hooks/usePersistedRoute";
import {
    validateMode,
    resolveAutoRouteType,
} from "@/lib/routing/modeEnforcement";
import { getTokensForChain, findToken } from "@/lib/tokens/tokenList";
import { getPersistedMode } from "@/lib/store/transactionStore";
import { NATIVE_TOKEN_ADDRESS, DEFAULT_SLIPPAGE_BPS } from "@/lib/utils/constants";
import type { Mode } from "@/lib/utils/constants";
import { isCantonChain } from "@/lib/chains/chainConfig";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useSession } from "@cantonconnect/react";

export function SwapBridgeApp() {
    // ─── State ──────────────────────────────────────────────────────────────────
    const [mode, setMode] = useState<Mode>("AUTO");
    const [fromChainId, setFromChainId] = useState("1");
    const [toChainId, setToChainId] = useState("42161");
    const [fromTokenAddress, setFromTokenAddress] = useState(NATIVE_TOKEN_ADDRESS);
    const [toTokenAddress, setToTokenAddress] = useState(NATIVE_TOKEN_ADDRESS);
    const [amount, setAmount] = useState("");
    const [slippageBps] = useState(DEFAULT_SLIPPAGE_BPS);
    const [recipientAddress, setRecipientAddress] = useState("");
    const [showRecipient, setShowRecipient] = useState(false);

    // ─── Wallet ─────────────────────────────────────────────────────────────────
    const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
    const { openConnectModal } = useConnectModal();
    // Canton session — available when Canton wallet is connected.
    // useSession() throws if called outside CantonConnectProvider (which is null during SSR
    // since cantonClient requires typeof window !== "undefined"). Safe fallback to null.
    let cantonSession: { partyId?: string } | null = null;
    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        cantonSession = useSession();
    } catch {
        // Canton provider not mounted (SSR or canton SDK unavailable) — partyId will be null
    }
    const cantonPartyId = cantonSession?.partyId;

    // Determine which chain type is active
    const fromIsCantonChain = isCantonChain(fromChainId);
    const toIsCantonChain = isCantonChain(toChainId);
    const isCantonRoute = fromIsCantonChain || toIsCantonChain;

    // The effective sender address for the active route type
    const senderAddress = isCantonRoute ? cantonPartyId : evmAddress;
    const isConnected = isCantonRoute ? !!cantonPartyId : isEvmConnected;

    // ─── Hooks ──────────────────────────────────────────────────────────────────
    const { quote, error: quoteError, loading: quoteLoading, fetchQuote, clearQuote } = useQuote();
    const swapExec = useSwapExecution();
    const bridgeExec = useBridgeExecution();
    const { persistedRoutes } = usePersistedRoute();

    // ─── Restore persisted mode ─────────────────────────────────────────────────
    useEffect(() => {
        const saved = getPersistedMode();
        if (saved === "AUTO" || saved === "SWAP_ONLY" || saved === "BRIDGE_ONLY") {
            setMode(saved);
        }
    }, []);

    // ─── Reset tokens when chain changes ───────────────────────────────────────
    useEffect(() => {
        const tokens = getTokensForChain(fromChainId);
        if (tokens.length > 0) {
            setFromTokenAddress(tokens[0].address);
        }
    }, [fromChainId]);

    useEffect(() => {
        const tokens = getTokensForChain(toChainId);
        if (tokens.length > 0) {
            setToTokenAddress(tokens[0].address);
        }
    }, [toChainId]);

    // ─── Mode validation ───────────────────────────────────────────────────────
    const modeValidation = useMemo(
        () =>
            validateMode({
                mode,
                fromChainId,
                toChainId,
                fromTokenAddress,
                toTokenAddress,
            }),
        [mode, fromChainId, toChainId, fromTokenAddress, toTokenAddress]
    );

    // ─── Selected tokens info ──────────────────────────────────────────────────
    const fromTokenInfo = useMemo(
        () => findToken(fromChainId, fromTokenAddress),
        [fromChainId, fromTokenAddress]
    );
    const toTokenInfo = useMemo(
        () => findToken(toChainId, toTokenAddress),
        [toChainId, toTokenAddress]
    );

    // ─── Can submit ────────────────────────────────────────────────────────────
    // Walletless: allow quote without wallet connection
    const canGetQuote =
        modeValidation.valid &&
        amount !== "" &&
        parseFloat(amount) > 0 &&
        fromTokenAddress &&
        toTokenAddress;

    // ─── Handlers ──────────────────────────────────────────────────────────────
    const handleGetQuote = useCallback(() => {
        if (!canGetQuote) return;
        fetchQuote({
            fromChainId,
            toChainId,
            fromTokenAddress,
            toTokenAddress,
            amount,
            slippageBps,
            mode,
            senderAddress: senderAddress,
            recipientAddress: recipientAddress || undefined,
        });
    }, [
        canGetQuote,
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        amount,
        slippageBps,
        mode,
        senderAddress,
        recipientAddress,
        fetchQuote,
    ]);

    const handleExecute = useCallback(() => {
        if (!quote) return;

        // If not connected, prompt the right wallet type
        if (!isConnected) {
            if (isCantonRoute) {
                // Canton wallet connect is handled by CantonWalletButton in the header
                // We can't programmatically open it, so show a user-friendly message
                alert("Please connect your Canton Wallet using the 'Canton Wallet' button in the header.");
            } else {
                openConnectModal?.();
            }
            return;
        }

        if (quote.routeType === "swap") {
            swapExec.executeSwap(quote);
        } else {
            bridgeExec.executeBridge(quote);
        }
    }, [quote, isConnected, isCantonRoute, openConnectModal, swapExec, bridgeExec]);

    // ─── Swap chain direction ──────────────────────────────────────────────────
    const handleSwapDirection = useCallback(() => {
        const tmpChain = fromChainId;
        const tmpToken = fromTokenAddress;
        setFromChainId(toChainId);
        setToChainId(tmpChain);
        setFromTokenAddress(toTokenAddress);
        setToTokenAddress(tmpToken);
        clearQuote();
    }, [fromChainId, toChainId, fromTokenAddress, toTokenAddress, clearQuote]);

    const activeStatus =
        quote?.routeType === "swap" ? swapExec.status : bridgeExec.status;
    const activeTxHash =
        quote?.routeType === "swap" ? swapExec.txHash : bridgeExec.txHash;
    const activeError =
        quote?.routeType === "swap" ? swapExec.error : bridgeExec.error;

    // ─── Button label logic ────────────────────────────────────────────────────
    const getButtonLabel = () => {
        if (!canGetQuote) return "Enter Amount";
        return "Get Quote";
    };

    const getExecuteLabel = () => {
        if (!isConnected) {
            return isCantonRoute ? "Connect Canton Wallet to Execute" : "Connect Wallet to Execute";
        }
        if (activeStatus === "APPROVAL_REQUIRED") return "Approve & Execute";
        if (activeStatus === "EXECUTING" || activeStatus === "BRIDGING") return "Processing...";
        if (activeStatus === "COMPLETED") return "✓ Done";
        return `Execute ${quote?.routeType === "swap" ? "Swap" : "Bridge"}`;
    };

    return (
        <div className="w-full max-w-lg mx-auto">
            {/* Card */}
            <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-surface-border">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-bold text-gray-100">
                            Swap & Bridge
                        </h1>
                        <div className="flex items-center gap-2">
                            {/* Settings gear */}
                            <button
                                onClick={() => setShowRecipient(!showRecipient)}
                                className={`p-2 rounded-lg transition-colors ${showRecipient
                                    ? "bg-brand-500/10 text-brand-400"
                                    : "text-gray-500 hover:text-gray-300 hover:bg-surface"
                                    }`}
                                title="Custom recipient address"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mode toggle */}
                <div className="px-6 pt-5">
                    <ModeToggle value={mode} onChange={setMode} />
                </div>

                {/* From section */}
                <div className="px-6 pt-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <ChainSelector
                            value={fromChainId}
                            onChange={(id) => {
                                setFromChainId(id);
                                clearQuote();
                            }}
                            label="From Chain"
                        />
                        <TokenSelector
                            chainId={fromChainId}
                            value={fromTokenAddress}
                            onChange={(addr) => {
                                setFromTokenAddress(addr);
                                clearQuote();
                            }}
                            label="From Token"
                        />
                    </div>
                    <AmountInput
                        value={amount}
                        onChange={(val) => {
                            setAmount(val);
                            clearQuote();
                        }}
                        label="Amount"
                        tokenSymbol={fromTokenInfo?.symbol}
                    />
                </div>

                {/* Direction swap button */}
                <div className="flex justify-center py-3">
                    <button
                        onClick={handleSwapDirection}
                        className="p-2 rounded-xl bg-surface border border-surface-border hover:bg-surface-overlay hover:border-surface-border-light transition-all duration-200 group"
                    >
                        <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-brand-400 transition-colors rotate-90"
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
                    </button>
                </div>

                {/* To section */}
                <div className="px-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <ChainSelector
                            value={toChainId}
                            onChange={(id) => {
                                setToChainId(id);
                                clearQuote();
                            }}
                            label="To Chain"
                        />
                        <TokenSelector
                            chainId={toChainId}
                            value={toTokenAddress}
                            onChange={(addr) => {
                                setToTokenAddress(addr);
                                clearQuote();
                            }}
                            label="To Token"
                        />
                    </div>
                </div>

                {/* Recipient address (walletless flow) */}
                {showRecipient && (
                    <div className="px-6 pt-4 animate-slide-up">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                                Recipient Address (optional)
                            </label>
                            <input
                                type="text"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                placeholder={isEvmConnected ? evmAddress : "0x... or paste wallet address"}
                                className="w-full px-4 py-2.5 bg-surface rounded-xl border border-surface-border text-gray-100 placeholder-gray-600 text-sm font-mono focus:outline-none focus:border-brand-500/50 transition-colors"
                            />
                            <p className="text-[10px] text-gray-600 mt-1.5">
                                Leave empty to use your connected wallet. Specify a different address to receive tokens elsewhere.
                            </p>
                        </div>
                    </div>
                )}

                {/* Mode error */}
                {!modeValidation.valid && modeValidation.error && (
                    <div className="mx-6 mt-4">
                        <div className="bg-accent-yellow/5 rounded-xl border border-accent-yellow/20 px-4 py-3">
                            <p className="text-sm text-accent-yellow">
                                {modeValidation.error.message}
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="px-6 py-5 space-y-3">
                    {!quote ? (
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={handleGetQuote}
                            disabled={!canGetQuote}
                            loading={quoteLoading}
                        >
                            {getButtonLabel()}
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={handleExecute}
                            disabled={
                                isEvmConnected &&
                                activeStatus !== "IDLE" &&
                                activeStatus !== "QUOTED" &&
                                activeStatus !== "APPROVAL_REQUIRED"
                            }
                            loading={
                                activeStatus === "EXECUTING" ||
                                activeStatus === "APPROVING" ||
                                activeStatus === "BRIDGING"
                            }
                        >
                            {getExecuteLabel()}
                        </Button>
                    )}

                    {/* Walletless info hint */}
                    {!isConnected && !quote && (
                        <p className="text-[10px] text-gray-600 text-center">
                            {isCantonRoute
                                ? "Connect Canton Wallet in the header to execute · Quotes are free"
                                : "No wallet needed to get a quote · Connect when ready to execute"
                            }
                        </p>
                    )}
                </div>

                {/* Quote panel */}
                <div className="px-6 pb-5">
                    <QuotePanel
                        quote={quote}
                        error={quoteError}
                        loading={quoteLoading}
                        mode={mode}
                    />
                </div>

                {/* Transaction stepper */}
                {quote && activeStatus !== "IDLE" && (
                    <div className="px-6 pb-5">
                        <TransactionStepper
                            route={quote}
                            status={activeStatus}
                            txHash={activeTxHash}
                            error={activeError}
                        />
                    </div>
                )}

                {/* Persisted routes notice */}
                {persistedRoutes.length > 0 && (
                    <div className="px-6 pb-5">
                        <div className="bg-brand-500/5 rounded-xl border border-brand-500/10 px-4 py-3">
                            <p className="text-xs text-brand-300">
                                {persistedRoutes.length} in-flight route(s) found from a previous session.
                                Status tracking has resumed.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                    Powered by ParaSwap · Jupiter · LI.FI
                </p>
            </div>
        </div>
    );
}
