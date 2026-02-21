// src/lib/routing/routingEngine.ts
// Deterministic routing engine: resolves { from, to, mode } → Route or RoutingError.
// Delegates to chain-specific adapters for actual quote/tx building.

import { isEvmChain, isSolanaChain, isCantonChain, isSuiChain, getChain } from "@/lib/chains/chainConfig";
import {
    validateMode,
    resolveAutoRouteType,
} from "@/lib/routing/modeEnforcement";
import type { QuoteRequest } from "@/lib/schemas/quote";
import type { Route, RoutingError } from "@/lib/schemas/route";
import type { Mode } from "@/lib/utils/constants";
import { NATIVE_TOKEN_ADDRESS } from "@/lib/utils/constants";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RouteResult {
    success: true;
    route: Route;
}

export interface RouteFailure {
    success: false;
    error: RoutingError;
}

export type RoutingResult = RouteResult | RouteFailure;

/**
 * Adapter interface — implemented by 1inch, Jupiter, and LI.FI adapters.
 */
export interface SwapAdapter {
    name: string;
    getQuote(params: AdapterQuoteParams): Promise<AdapterQuoteResult>;
}

export interface BridgeAdapter {
    name: string;
    getRoute(params: AdapterBridgeParams): Promise<AdapterBridgeResult>;
}

export interface AdapterQuoteParams {
    chainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    slippageBps: number;
    senderAddress?: string;
}

export interface AdapterQuoteResult {
    success: boolean;
    toAmount?: string;
    toAmountMin?: string;
    exchangeRate?: string;
    priceImpact?: number;
    estimatedGas?: string;
    fees?: Array<{
        name: string;
        amount: string;
        token: string;
        amountUsd?: number;
    }>;
    transactionData?: {
        to?: string;
        data?: string;
        value?: string;
        gasLimit?: string;
        /** Canton/Solana: serialized transaction or DAML intent */
        serializedTransaction?: string;
    };
    error?: string;
}

export interface AdapterBridgeParams {
    fromChainId: string;
    toChainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    slippageBps: number;
    senderAddress?: string;
    recipientAddress?: string;
}

export interface AdapterBridgeResult {
    success: boolean;
    toAmount?: string;
    toAmountMin?: string;
    exchangeRate?: string;
    priceImpact?: number;
    etaSeconds?: number;
    fees?: Array<{
        name: string;
        amount: string;
        token: string;
        amountUsd?: number;
    }>;
    steps?: Array<{
        id: string;
        type: "approve" | "swap" | "bridgeSend" | "bridgeReceive" | "destinationSwap";
        description: string;
        chainId: string;
        tool: string;
        transactionData?: {
            to?: string;
            data?: string;
            value?: string;
            gasLimit?: string;
            /** Canton/Solana: serialized transaction or DAML intent */
            serializedTransaction?: string;
        };
    }>;
    providerRouteId?: string;
    error?: string;
}

// ─── Adapter Registry (set at init) ─────────────────────────────────────────

let evmSwapAdapter: SwapAdapter | null = null;
let solanaSwapAdapter: SwapAdapter | null = null;
let suiSwapAdapter: SwapAdapter | null = null;
let cantonSwapAdapter: SwapAdapter | null = null;
let bridgeAdapter: BridgeAdapter | null = null;
let cantonBridgeAdapter: BridgeAdapter | null = null;
let suiBridgeAdapter: BridgeAdapter | null = null;

export function registerEvmSwapAdapter(adapter: SwapAdapter) {
    evmSwapAdapter = adapter;
}

export function registerSolanaSwapAdapter(adapter: SwapAdapter) {
    solanaSwapAdapter = adapter;
}

export function registerCantonSwapAdapter(adapter: SwapAdapter) {
    cantonSwapAdapter = adapter;
}

export function registerBridgeAdapter(adapter: BridgeAdapter) {
    bridgeAdapter = adapter;
}

export function registerCantonBridgeAdapter(adapter: BridgeAdapter) {
    cantonBridgeAdapter = adapter;
}

export function registerSuiSwapAdapter(adapter: SwapAdapter) {
    suiSwapAdapter = adapter;
}

export function registerSuiBridgeAdapter(adapter: BridgeAdapter) {
    suiBridgeAdapter = adapter;
}

// ─── Routing Engine ─────────────────────────────────────────────────────────

function generateRouteId(): string {
    // Crypto-based UUID
    return crypto.randomUUID();
}

/**
 * Main entry point: resolve a quote request into a Route.
 */
export async function resolveRoute(
    request: QuoteRequest
): Promise<RoutingResult> {
    const {
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        amount,
        slippageBps,
        mode,
        senderAddress,
        recipientAddress,
    } = request;

    // 1. Validate chains exist
    const fromChain = getChain(fromChainId);
    const toChain = getChain(toChainId);
    if (!fromChain) {
        return {
            success: false,
            error: {
                code: "INVALID_FROM_CHAIN",
                message: `Unsupported source chain: ${fromChainId}`,
            },
        };
    }
    if (!toChain) {
        return {
            success: false,
            error: {
                code: "INVALID_TO_CHAIN",
                message: `Unsupported destination chain: ${toChainId}`,
            },
        };
    }

    // 2. Validate mode constraints
    const modeCheck = validateMode({
        mode: mode as Mode,
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
    });
    if (!modeCheck.valid) {
        return { success: false, error: modeCheck.error! };
    }

    // 3. Determine route type
    const sameChain = fromChainId === toChainId;
    let routeType: "swap" | "bridge" | "bridge+swap";
    let routeReason: string;

    if (mode === "SWAP_ONLY") {
        routeType = "swap";
        routeReason = "Swap-only mode selected.";
    } else if (mode === "BRIDGE_ONLY") {
        routeType = "bridge";
        routeReason = "Bridge-only mode selected.";
    } else {
        // AUTO
        const auto = resolveAutoRouteType(fromChainId, toChainId);
        routeType = auto.routeType;
        routeReason = auto.reason;
    }

    // 4. Delegate to the correct adapter
    if (routeType === "swap") {
        return handleSwap({
            fromChainId,
            toChainId,
            fromTokenAddress,
            toTokenAddress,
            amount,
            slippageBps,
            senderAddress,
            mode: mode as Mode,
            routeReason,
        });
    } else {
        return handleBridge({
            fromChainId,
            toChainId,
            fromTokenAddress,
            toTokenAddress,
            amount,
            slippageBps,
            senderAddress,
            recipientAddress,
            mode: mode as Mode,
            routeReason,
        });
    }
}

// ─── Internal handlers ──────────────────────────────────────────────────────

interface SwapParams {
    fromChainId: string;
    toChainId: string;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string;
    slippageBps: number;
    senderAddress?: string;
    mode: Mode;
    routeReason: string;
}

async function handleSwap(params: SwapParams): Promise<RoutingResult> {
    const { fromChainId, fromTokenAddress, toTokenAddress, amount, slippageBps, senderAddress, mode, routeReason } = params;

    // Select adapter
    let adapter: SwapAdapter | null;
    if (isSolanaChain(fromChainId)) {
        adapter = solanaSwapAdapter;
    } else if (isSuiChain(fromChainId)) {
        adapter = suiSwapAdapter;
    } else if (isEvmChain(fromChainId)) {
        adapter = evmSwapAdapter;
    } else if (isCantonChain(fromChainId)) {
        adapter = cantonSwapAdapter;
    } else {
        return {
            success: false,
            error: { code: "NO_ADAPTER", message: `No swap adapter for chain ${fromChainId}` },
        };
    }

    if (!adapter) {
        return {
            success: false,
            error: { code: "ADAPTER_NOT_REGISTERED", message: "Swap adapter not initialized." },
        };
    }

    const result = await adapter.getQuote({
        chainId: fromChainId,
        fromTokenAddress,
        toTokenAddress,
        amount,
        slippageBps,
        senderAddress,
    });

    if (!result.success || !result.toAmount) {
        return {
            success: false,
            error: {
                code: "QUOTE_FAILED",
                message: result.error || "Failed to get swap quote.",
            },
        };
    }

    // Build steps
    const steps = [];
    const isNativeFrom = fromTokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase();

    // EVM: Check if approval is needed (non-native ERC-20)
    if (isEvmChain(fromChainId) && !isNativeFrom) {
        steps.push({
            id: `step-approve-${generateRouteId()}`,
            type: "approve" as const,
            description: `Approve token spending`,
            chainId: fromChainId,
            tool: adapter.name,
            status: "pending" as const,
        });
    }

    steps.push({
        id: `step-swap-${generateRouteId()}`,
        type: "swap" as const,
        description: `Swap via ${adapter.name}`,
        chainId: fromChainId,
        tool: adapter.name,
        transactionData: result.transactionData,
        status: "pending" as const,
    });

    const route: Route = {
        routeId: generateRouteId(),
        mode,
        routeType: "swap",
        provider: adapter.name,
        fromChainId,
        toChainId: fromChainId, // same chain for swap
        fromToken: { address: fromTokenAddress, symbol: "", decimals: 0 },
        toToken: { address: toTokenAddress, symbol: "", decimals: 0 },
        fromAmount: amount,
        toAmount: result.toAmount,
        toAmountMin: result.toAmountMin || result.toAmount,
        steps,
        fees: result.fees || [],
        exchangeRate: result.exchangeRate,
        priceImpact: result.priceImpact,
        estimatedGas: result.estimatedGas,
        routeReason,
        createdAt: Date.now(),
    };

    return { success: true, route };
}

interface BridgeParams extends SwapParams {
    recipientAddress?: string;
}

async function handleBridge(params: BridgeParams): Promise<RoutingResult> {
    const {
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        amount,
        slippageBps,
        senderAddress,
        recipientAddress,
        mode,
        routeReason,
    } = params;

    // For Canton bridges, use the Canton bridge adapter
    // For Sui bridges, use the Sui bridge adapter
    let activeBridgeAdapter: BridgeAdapter | null;
    if ((fromChainId === "canton" || toChainId === "canton") && cantonBridgeAdapter) {
        activeBridgeAdapter = cantonBridgeAdapter;
    } else if ((fromChainId === "sui" || toChainId === "sui") && suiBridgeAdapter) {
        activeBridgeAdapter = suiBridgeAdapter;
    } else {
        activeBridgeAdapter = bridgeAdapter;
    }

    if (!activeBridgeAdapter) {
        return {
            success: false,
            error: { code: "ADAPTER_NOT_REGISTERED", message: "Bridge adapter not initialized." },
        };
    }

    const result = await activeBridgeAdapter.getRoute({
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        amount,
        slippageBps,
        senderAddress,
        recipientAddress,
    });

    if (!result.success || !result.toAmount) {
        return {
            success: false,
            error: {
                code: "BRIDGE_ROUTE_FAILED",
                message: result.error || "Failed to get bridge route.",
            },
        };
    }

    // Determine if this is bridge+swap
    const hasDestSwap = result.steps?.some((s) => s.type === "destinationSwap");
    const routeType = hasDestSwap ? "bridge+swap" as const : "bridge" as const;

    const steps = (result.steps || []).map((s) => ({
        ...s,
        status: "pending" as const,
    }));

    const route: Route = {
        routeId: generateRouteId(),
        mode,
        routeType,
        provider: activeBridgeAdapter.name,
        fromChainId,
        toChainId,
        fromToken: { address: fromTokenAddress, symbol: "", decimals: 0 },
        toToken: { address: toTokenAddress, symbol: "", decimals: 0 },
        fromAmount: amount,
        toAmount: result.toAmount,
        toAmountMin: result.toAmountMin || result.toAmount,
        steps,
        fees: result.fees || [],
        etaSeconds: result.etaSeconds,
        exchangeRate: result.exchangeRate,
        priceImpact: result.priceImpact,
        routeReason,
        createdAt: Date.now(),
    };

    return { success: true, route };
}
