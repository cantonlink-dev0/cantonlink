// src/lib/adapters/bridge/lifiAdapter.ts
// LI.FI API adapter for cross-chain bridging + swap-on-route
// Docs: https://docs.li.fi/li.fi-api/li.fi-api

import type {
    BridgeAdapter,
    AdapterBridgeParams,
    AdapterBridgeResult,
} from "@/lib/routing/routingEngine";
import type { StatusResponse } from "@/lib/schemas/status";

const LIFI_BASE_URL = "https://li.quest/v1";

function getApiKey(): string {
    return process.env.LIFI_API_KEY || "";
}

function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };
    const apiKey = getApiKey();
    if (apiKey) {
        headers["x-lifi-api-key"] = apiKey;
    }
    return headers;
}

/**
 * LI.FI bridge adapter.
 *
 * Endpoints used:
 * - POST /advanced/routes  — get cross-chain routes with steps
 * - GET  /status           — track bridge transaction status
 * - GET  /tokens           — search for supported tokens
 *
 * Works without API key (rate-limited). With key, gets full access.
 */
export const lifiAdapter: BridgeAdapter = {
    name: "LI.FI",

    async getRoute(params: AdapterBridgeParams): Promise<AdapterBridgeResult> {
        try {
            // POST /advanced/routes
            const routeRequest = {
                fromChainId: parseInt(params.fromChainId, 10),
                toChainId: parseInt(params.toChainId, 10),
                fromTokenAddress: params.fromTokenAddress,
                toTokenAddress: params.toTokenAddress,
                fromAmount: params.amount,
                fromAddress: params.senderAddress,
                toAddress: params.recipientAddress || params.senderAddress,
                integrator: "cantonlink", // CantonLink integrator ID for LI.FI revenue share
                options: {
                    slippage: params.slippageBps / 10000, // LI.FI uses decimal (0.005 = 0.5%)
                    order: "RECOMMENDED",
                    allowSwitchChain: true,
                },
            };

            const response = await fetch(`${LIFI_BASE_URL}/advanced/routes`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(routeRequest),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                return {
                    success: false,
                    error: `LI.FI API error (${response.status}): ${errorBody}`,
                };
            }

            const data = await response.json();

            // LI.FI /advanced/routes response:
            // { routes: [{ id, fromAmount, toAmount, toAmountMin, steps: [...], tags, ... }] }
            if (!data.routes || data.routes.length === 0) {
                return {
                    success: false,
                    error: "No bridge routes found for this token pair.",
                };
            }

            // Take the recommended (first) route
            const bestRoute = data.routes[0];

            // Convert LI.FI steps into our format
            const steps: AdapterBridgeResult["steps"] = [];

            for (const lifiStep of bestRoute.steps || []) {
                // Check if approval is needed
                if (lifiStep.estimate?.approvalAddress) {
                    steps.push({
                        id: `${lifiStep.id}-approve`,
                        type: "approve",
                        description: `Approve ${lifiStep.action?.fromToken?.symbol || "token"} for ${lifiStep.tool || "bridge"}`,
                        chainId: String(lifiStep.action?.fromChainId || params.fromChainId),
                        tool: lifiStep.tool || "LI.FI",
                    });
                }

                // Map LI.FI step types to our types
                if (lifiStep.type === "swap") {
                    steps.push({
                        id: lifiStep.id,
                        type: "swap",
                        description: `Swap ${lifiStep.action?.fromToken?.symbol || ""} → ${lifiStep.action?.toToken?.symbol || ""} via ${lifiStep.tool || ""}`,
                        chainId: String(lifiStep.action?.fromChainId || params.fromChainId),
                        tool: lifiStep.tool || "LI.FI",
                        transactionData: lifiStep.transactionRequest
                            ? {
                                to: lifiStep.transactionRequest.to,
                                data: lifiStep.transactionRequest.data,
                                value: String(lifiStep.transactionRequest.value || "0"),
                                gasLimit: lifiStep.transactionRequest.gasLimit
                                    ? String(lifiStep.transactionRequest.gasLimit)
                                    : undefined,
                            }
                            : undefined,
                    });
                } else if (lifiStep.type === "cross") {
                    steps.push({
                        id: `${lifiStep.id}-send`,
                        type: "bridgeSend",
                        description: `Bridge via ${lifiStep.tool || "bridge"} (${params.fromChainId} → ${params.toChainId})`,
                        chainId: String(lifiStep.action?.fromChainId || params.fromChainId),
                        tool: `LI.FI/${lifiStep.tool || "bridge"}`,
                        transactionData: lifiStep.transactionRequest
                            ? {
                                to: lifiStep.transactionRequest.to,
                                data: lifiStep.transactionRequest.data,
                                value: String(lifiStep.transactionRequest.value || "0"),
                                gasLimit: lifiStep.transactionRequest.gasLimit
                                    ? String(lifiStep.transactionRequest.gasLimit)
                                    : undefined,
                            }
                            : undefined,
                    });
                    steps.push({
                        id: `${lifiStep.id}-receive`,
                        type: "bridgeReceive",
                        description: `Receive on chain ${params.toChainId}`,
                        chainId: String(lifiStep.action?.toChainId || params.toChainId),
                        tool: `LI.FI/${lifiStep.tool || "bridge"}`,
                    });
                } else if (lifiStep.type === "lifi") {
                    // Combined lifi step — may include sub-steps
                    const included = lifiStep.includedSteps || [];
                    for (const sub of included) {
                        if (sub.type === "swap") {
                            const isDestination =
                                String(sub.action?.fromChainId) === params.toChainId;
                            steps.push({
                                id: sub.id,
                                type: isDestination ? "destinationSwap" : "swap",
                                description: `${isDestination ? "Destination swap" : "Swap"}: ${sub.action?.fromToken?.symbol || ""} → ${sub.action?.toToken?.symbol || ""} via ${sub.tool || ""}`,
                                chainId: String(sub.action?.fromChainId || params.fromChainId),
                                tool: sub.tool || "LI.FI",
                            });
                        } else if (sub.type === "cross") {
                            steps.push({
                                id: `${sub.id}-send`,
                                type: "bridgeSend",
                                description: `Bridge via ${sub.tool || "bridge"}`,
                                chainId: String(sub.action?.fromChainId || params.fromChainId),
                                tool: `LI.FI/${sub.tool || "bridge"}`,
                            });
                            steps.push({
                                id: `${sub.id}-receive`,
                                type: "bridgeReceive",
                                description: `Receive on chain ${params.toChainId}`,
                                chainId: String(sub.action?.toChainId || params.toChainId),
                                tool: `LI.FI/${sub.tool || "bridge"}`,
                            });
                        }
                    }

                    // If no included steps, add the main step transaction
                    if (included.length === 0 && lifiStep.transactionRequest) {
                        steps.push({
                            id: lifiStep.id,
                            type: "bridgeSend",
                            description: `Bridge via ${lifiStep.tool || "LI.FI"}`,
                            chainId: params.fromChainId,
                            tool: lifiStep.tool || "LI.FI",
                            transactionData: {
                                to: lifiStep.transactionRequest.to,
                                data: lifiStep.transactionRequest.data,
                                value: String(lifiStep.transactionRequest.value || "0"),
                                gasLimit: lifiStep.transactionRequest.gasLimit
                                    ? String(lifiStep.transactionRequest.gasLimit)
                                    : undefined,
                            },
                        });
                    }
                }
            }

            // Calculate ETA from the route estimate
            let etaSeconds: number | undefined;
            if (bestRoute.steps) {
                etaSeconds = bestRoute.steps.reduce(
                    (sum: number, s: { estimate?: { executionDuration?: number } }) =>
                        sum + (s.estimate?.executionDuration || 0),
                    0
                );
            }

            // Calculate fees
            const fees: AdapterBridgeResult["fees"] = [];
            if (bestRoute.gasCostUSD) {
                fees.push({
                    name: "Gas cost",
                    amount: bestRoute.gasCostUSD,
                    token: "USD",
                    amountUsd: parseFloat(bestRoute.gasCostUSD) || 0,
                });
            }

            return {
                success: true,
                toAmount: bestRoute.toAmount,
                toAmountMin: bestRoute.toAmountMin,
                etaSeconds,
                fees,
                steps,
                providerRouteId: bestRoute.id,
            };
        } catch (err) {
            return {
                success: false,
                error: `LI.FI adapter error: ${err instanceof Error ? err.message : String(err)}`,
            };
        }
    },
};

/**
 * Poll LI.FI bridge status.
 *
 * GET /status?txHash={hash}&bridge={bridge}&fromChain={chainId}&toChain={chainId}
 */
export async function getLifiBridgeStatus(
    txHash: string,
    fromChainId: string,
    toChainId: string,
    bridge?: string
): Promise<StatusResponse> {
    try {
        const params = new URLSearchParams({
            txHash,
            fromChain: fromChainId,
            toChain: toChainId,
        });
        if (bridge) {
            params.set("bridge", bridge);
        }

        const response = await fetch(`${LIFI_BASE_URL}/status?${params.toString()}`, {
            headers: getHeaders(),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            return {
                routeId: txHash,
                status: "FAILED",
                error: `LI.FI status error (${response.status}): ${errorBody}`,
                stepStatuses: [],
                updatedAt: Date.now(),
            };
        }

        const data = await response.json();

        // LI.FI /status response shape:
        // { status: "PENDING"|"DONE"|"FAILED"|"NOT_FOUND", substatus, receiving, sending }

        let mappedStatus: StatusResponse["status"];
        switch (data.status) {
            case "DONE":
                mappedStatus = "COMPLETED";
                break;
            case "FAILED":
                mappedStatus = "FAILED";
                break;
            case "PENDING":
            case "NOT_FOUND":
            default:
                mappedStatus = "BRIDGING";
                break;
        }

        return {
            routeId: txHash,
            status: mappedStatus,
            substatus: data.substatus,
            fromTxHash: data.sending?.txHash || txHash,
            toTxHash: data.receiving?.txHash,
            bridgeTxLink: data.lifiExplorerLink,
            stepStatuses: [],
            updatedAt: Date.now(),
        };
    } catch (err) {
        return {
            routeId: txHash,
            status: "FAILED",
            error: `LI.FI status error: ${err instanceof Error ? err.message : String(err)}`,
            stepStatuses: [],
            updatedAt: Date.now(),
        };
    }
}
