// src/lib/hooks/useOTCOrders.ts
// Hook for OTC order management — real on-chain escrow via OTCEscrow contract
"use client";

import { useState, useCallback, useEffect } from "react";
import type { OTCOrder, CreateOrderParams } from "@/lib/utils/otcTypes";
import {
    loadOrders,
    saveOrders,
    generateOrderId,
} from "@/lib/store/otcStore";
import {
    OTC_ESCROW_ABI,
    ERC20_APPROVE_ABI,
    isOTCDeployed,
    getOTCAddress,
} from "@/lib/contracts/otcEscrowAbi";
import { NATIVE_TOKEN_ADDRESS } from "@/lib/utils/constants";

/**
 * Parse a human-readable amount into wei/smallest-unit bigint.
 */
function parseAmount(amount: string, decimals: number): bigint {
    const parts = amount.split(".");
    const whole = parts[0] || "0";
    const frac = (parts[1] || "").padEnd(decimals, "0").slice(0, decimals);
    return BigInt(whole + frac);
}

/**
 * Check if the token is native ETH (address(0) for the contract).
 */
function isNativeToken(address: string): boolean {
    return (
        address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ||
        address === "0x0000000000000000000000000000000000000000"
    );
}

export function useOTCOrders() {
    const [orders, setOrders] = useState<OTCOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load orders on mount
    useEffect(() => {
        setOrders(loadOrders());
    }, []);

    // Persist on change
    useEffect(() => {
        if (orders.length > 0) {
            saveOrders(orders);
        }
    }, [orders]);

    /**
     * Create a new order via the OTCEscrow smart contract.
     *
     * Requires: wagmi's writeContract or similar to be called from the UI.
     * This hook prepares the contract call parameters. The UI component
     * must handle the actual wallet transaction signing.
     */
    const createOrder = useCallback(
        async (params: CreateOrderParams, makerAddress: string) => {
            setLoading(true);
            setError(null);

            try {
                // Check if contract is deployed on this chain
                if (!isOTCDeployed(params.sellChainId)) {
                    throw new Error(
                        `OTC escrow not yet deployed on chain ${params.sellChainId}. Coming soon.`
                    );
                }

                const escrowAddress = getOTCAddress(params.sellChainId);
                const sellAmount = parseAmount(params.sellAmount, params.sellTokenDecimals);
                const buyAmount = parseAmount(params.buyAmount, params.buyTokenDecimals);

                const now = new Date();
                const expiresAt = params.expiresInHours
                    ? new Date(
                        now.getTime() + params.expiresInHours * 60 * 60 * 1000
                    ).toISOString()
                    : undefined;

                const expiryTimestamp = expiresAt
                    ? BigInt(Math.floor(new Date(expiresAt).getTime() / 1000))
                    : BigInt(0);

                const sellTokenOnChain = isNativeToken(params.sellTokenAddress)
                    ? "0x0000000000000000000000000000000000000000"
                    : params.sellTokenAddress;

                const buyTokenOnChain = isNativeToken(params.buyTokenAddress)
                    ? "0x0000000000000000000000000000000000000000"
                    : params.buyTokenAddress;

                const allowedTaker = params.allowedTaker || "0x0000000000000000000000000000000000000000";

                // Return the contract call params so the UI can execute via wagmi
                const contractCallParams = {
                    address: escrowAddress as `0x${string}`,
                    abi: OTC_ESCROW_ABI,
                    functionName: "createOrder" as const,
                    args: [
                        sellTokenOnChain as `0x${string}`,
                        sellAmount,
                        buyTokenOnChain as `0x${string}`,
                        buyAmount,
                        expiryTimestamp,
                        allowedTaker as `0x${string}`,
                    ] as const,
                    value: isNativeToken(params.sellTokenAddress) ? sellAmount : BigInt(0),
                };

                // If selling ERC-20, need approval first
                const needsApproval = !isNativeToken(params.sellTokenAddress);

                const approvalParams = needsApproval
                    ? {
                        address: params.sellTokenAddress as `0x${string}`,
                        abi: ERC20_APPROVE_ABI,
                        functionName: "approve" as const,
                        args: [escrowAddress as `0x${string}`, sellAmount] as const,
                    }
                    : null;

                // Create order record locally (will be updated with tx hash after signing)
                const newOrder: OTCOrder = {
                    id: generateOrderId(),
                    maker: makerAddress,
                    sellChainId: params.sellChainId,
                    sellTokenAddress: params.sellTokenAddress,
                    sellTokenSymbol: params.sellTokenSymbol,
                    sellTokenDecimals: params.sellTokenDecimals,
                    sellAmount: params.sellAmount,
                    buyChainId: params.buyChainId,
                    buyTokenAddress: params.buyTokenAddress,
                    buyTokenSymbol: params.buyTokenSymbol,
                    buyTokenDecimals: params.buyTokenDecimals,
                    buyAmount: params.buyAmount,
                    status: "OPEN",
                    createdAt: now.toISOString(),
                    expiresAt,
                    allowedTaker: params.allowedTaker || undefined,
                    // Tx hash will be set by UI after wallet signs
                    escrowTxHash: undefined,
                };

                setOrders((prev) => [newOrder, ...prev]);

                return {
                    order: newOrder,
                    contractCallParams,
                    approvalParams,
                    needsApproval,
                };
            } catch (e: any) {
                setError(e?.message || "Failed to create order");
                return null;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    /**
     * Fill an order via the OTCEscrow smart contract.
     * Returns contract call params for the UI to execute.
     */
    const fillOrder = useCallback(
        async (orderId: string, takerAddress: string) => {
            setLoading(true);
            setError(null);

            try {
                const order = orders.find((o) => o.id === orderId);
                if (!order) throw new Error("Order not found");
                if (order.status !== "OPEN") throw new Error("Order is not open");
                if (order.maker.toLowerCase() === takerAddress.toLowerCase())
                    throw new Error("Cannot fill your own order");
                if (
                    order.allowedTaker &&
                    order.allowedTaker.toLowerCase() !== takerAddress.toLowerCase()
                )
                    throw new Error("This order is restricted to a specific address");
                if (order.expiresAt && new Date(order.expiresAt) < new Date())
                    throw new Error("Order has expired");

                if (!isOTCDeployed(order.sellChainId)) {
                    throw new Error(
                        `OTC escrow not yet deployed on chain ${order.sellChainId}.`
                    );
                }

                if (order.onChainOrderId === undefined) {
                    throw new Error("Order has no on-chain ID — it may not have been confirmed yet.");
                }

                const escrowAddress = getOTCAddress(order.sellChainId);
                const buyAmount = parseAmount(order.buyAmount, order.buyTokenDecimals);

                const contractCallParams = {
                    address: escrowAddress as `0x${string}`,
                    abi: OTC_ESCROW_ABI,
                    functionName: "fillOrder" as const,
                    args: [BigInt(order.onChainOrderId)] as const,
                    value: isNativeToken(order.buyTokenAddress) ? buyAmount : BigInt(0),
                };

                // If paying with ERC-20, need approval
                const needsApproval = !isNativeToken(order.buyTokenAddress);

                const approvalParams = needsApproval
                    ? {
                        address: order.buyTokenAddress as `0x${string}`,
                        abi: ERC20_APPROVE_ABI,
                        functionName: "approve" as const,
                        args: [escrowAddress as `0x${string}`, buyAmount] as const,
                    }
                    : null;

                return {
                    contractCallParams,
                    approvalParams,
                    needsApproval,
                    onSuccess: () => {
                        setOrders((prev) =>
                            prev.map((o) =>
                                o.id === orderId
                                    ? {
                                        ...o,
                                        status: "FILLED" as const,
                                        taker: takerAddress,
                                        filledAt: new Date().toISOString(),
                                    }
                                    : o
                            )
                        );
                    },
                };
            } catch (e: any) {
                setError(e?.message || "Failed to fill order");
                return null;
            } finally {
                setLoading(false);
            }
        },
        [orders]
    );

    /**
     * Cancel an order via the OTCEscrow smart contract.
     * Returns contract call params for the UI to execute.
     */
    const cancelOrder = useCallback(
        async (orderId: string, callerAddress: string) => {
            setLoading(true);
            setError(null);

            try {
                const order = orders.find((o) => o.id === orderId);
                if (!order) throw new Error("Order not found");
                if (order.status !== "OPEN") throw new Error("Order is not open");
                if (order.maker.toLowerCase() !== callerAddress.toLowerCase())
                    throw new Error("Only the maker can cancel this order");

                if (!isOTCDeployed(order.sellChainId)) {
                    throw new Error(
                        `OTC escrow not yet deployed on chain ${order.sellChainId}.`
                    );
                }

                if (order.onChainOrderId === undefined) {
                    throw new Error("Order has no on-chain ID.");
                }

                const escrowAddress = getOTCAddress(order.sellChainId);

                const contractCallParams = {
                    address: escrowAddress as `0x${string}`,
                    abi: OTC_ESCROW_ABI,
                    functionName: "cancelOrder" as const,
                    args: [BigInt(order.onChainOrderId)] as const,
                };

                return {
                    contractCallParams,
                    onSuccess: () => {
                        setOrders((prev) =>
                            prev.map((o) =>
                                o.id === orderId
                                    ? { ...o, status: "CANCELLED" as const }
                                    : o
                            )
                        );
                    },
                };
            } catch (e: any) {
                setError(e?.message || "Failed to cancel order");
                return null;
            } finally {
                setLoading(false);
            }
        },
        [orders]
    );

    /**
     * Update an order with real tx hash and on-chain ID after wallet confirmation.
     */
    const confirmOrderOnChain = useCallback(
        (orderId: string, txHash: string, onChainOrderId: number) => {
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId
                        ? { ...o, escrowTxHash: txHash, onChainOrderId }
                        : o
                )
            );
        },
        []
    );

    /** Get only open orders */
    const openOrders = orders.filter((o) => o.status === "OPEN");

    /** Get orders by specific maker */
    const getMyOrders = useCallback(
        (address: string) =>
            orders.filter(
                (o) => o.maker.toLowerCase() === address.toLowerCase()
            ),
        [orders]
    );

    const clearError = useCallback(() => setError(null), []);

    return {
        orders,
        openOrders,
        loading,
        error,
        createOrder,
        fillOrder,
        cancelOrder,
        confirmOrderOnChain,
        getMyOrders,
        clearError,
    };
}
