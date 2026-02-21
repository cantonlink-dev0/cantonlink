// src/lib/adapters/canton/cantonBridgeAdapterWrapper.ts
//
// Wraps cantonBridgeAdapter.ts helpers into the BridgeAdapter interface
// so the routing engine can invoke it generically.
//
// Supported routes:
//   ETH (chain 1)  ──xReserve──►  Canton (chain "canton")   [deposit]
//   Canton         ──xReserve──►  ETH (chain 1)              [burn]
//
// Note: Burn requires the user to have a BridgeUserAgreement CID on Canton.
// We return the calldata structure; the Canton wallet must sign & submit it.

import type { BridgeAdapter, AdapterBridgeParams, AdapterBridgeResult } from "@/lib/routing/routingEngine";
import {
    buildXReserveDeposit,
    buildCantonBurnCommand,
    CANTON_BRIDGE_ADDRESSES,
    CIRCLE_XRESERVE_API,
} from "./cantonBridgeAdapter";

export const cantonBridgeAdapterWrapper: BridgeAdapter = {
    name: "Canton xReserve",

    async getRoute(params: AdapterBridgeParams): Promise<AdapterBridgeResult> {
        const { fromChainId, toChainId, fromTokenAddress, toTokenAddress, amount, senderAddress, recipientAddress } = params;

        const isDeposit = (fromChainId === "1" || fromChainId === "ethereum") && toChainId === "canton";
        const isBurn = fromChainId === "canton" && (toChainId === "1" || toChainId === "ethereum");

        // ── ETH → Canton (deposit USDC → USDCx) ───────────────────────────────
        if (isDeposit) {
            try {
                const cantonRecipient = recipientAddress || senderAddress || "";
                if (!cantonRecipient) {
                    return { success: false, error: "Canton recipient party ID required for xReserve deposit" };
                }

                const network: "mainnet" | "sepolia" =
                    (process.env.NEXT_PUBLIC_CANTON_NETWORK as "mainnet" | "sepolia") || "mainnet";

                const depositData = buildXReserveDeposit({
                    fromAddress: senderAddress || "0x0000000000000000000000000000000000000000",
                    amountUsd: amount,
                    cantonRecipient,
                    network,
                });

                const addrs = CANTON_BRIDGE_ADDRESSES[network];
                const amountNum = parseFloat(amount);
                const amountWei = Math.floor(amountNum * 1_000_000).toString(); // USDC 6 decimals

                return {
                    success: true,
                    toAmount: amountWei, // 1:1 USDC → USDCx
                    toAmountMin: amountWei,
                    exchangeRate: "1.0",
                    priceImpact: 0,
                    etaSeconds: depositData.estimatedTimeMinutes * 60,
                    fees: [
                        {
                            name: "xReserve bridge fee",
                            amount: "0",
                            token: "USDC",
                            amountUsd: 0,
                        },
                    ],
                    steps: [
                        {
                            id: "step-approve-usdc",
                            type: "approve",
                            description: `Approve ${amount} USDC for xReserve contract`,
                            chainId: fromChainId,
                            tool: "Canton xReserve",
                            transactionData: {
                                to: depositData.approveData.to,
                                data: depositData.approveData.data,
                                value: "0",
                            },
                        },
                        {
                            id: "step-deposit-xreserve",
                            type: "bridgeSend",
                            description: `Deposit ${amount} USDC to Canton via xReserve (domain ${addrs.cantonDomain})`,
                            chainId: fromChainId,
                            tool: "Canton xReserve",
                            transactionData: {
                                to: depositData.depositData.to,
                                data: depositData.depositData.data,
                                value: "0",
                            },
                        },
                        {
                            id: "step-attestation-wait",
                            type: "bridgeReceive",
                            description: `Wait for Circle attestation (≈${depositData.estimatedTimeMinutes} min). Poll: ${CIRCLE_XRESERVE_API}/v1/attestations/{messageHash}`,
                            chainId: "canton",
                            tool: "Circle xReserve API",
                        },
                        {
                            id: "step-canton-mint",
                            type: "swap", // repurposed: "execute on Canton"
                            description: "Submit BridgeUserAgreement_Mint on Canton — USDCx credited to account",
                            chainId: "canton",
                            tool: "Canton Ledger",
                            transactionData: {
                                serializedTransaction: JSON.stringify({
                                    type: "canton:bridge:mint",
                                    note: "Submit after attestation via Canton wallet signTransaction(). Requires BridgeUserAgreementContractId + DepositAttestationCid from the Ethereum tx.",
                                }),
                            },
                        },
                    ],
                };
            } catch (err) {
                return { success: false, error: `xReserve deposit build failed: ${err instanceof Error ? err.message : String(err)}` };
            }
        }

        // ── Canton → ETH (burn USDCx → USDC) ──────────────────────────────────
        if (isBurn) {
            try {
                const ethRecipient = recipientAddress || senderAddress || "";
                if (!ethRecipient) {
                    return { success: false, error: "Ethereum recipient address required for xReserve burn" };
                }

                const burnCommand = buildCantonBurnCommand({
                    bridgeUserAgreementContractId: "<user-bridge-agreement-cid>", // User-specific, obtained from Canton ledger
                    amount,
                    destinationEthAddress: ethRecipient,
                    holdingCids: [], // User-specific USDCx holdings, obtained from Canton ledger
                });

                return {
                    success: true,
                    toAmount: Math.floor(parseFloat(amount) * 1_000_000).toString(),
                    toAmountMin: Math.floor(parseFloat(amount) * 1_000_000).toString(),
                    exchangeRate: "1.0",
                    priceImpact: 0,
                    etaSeconds: 600, // ~10 min for burn + Ethereum relay
                    fees: [
                        {
                            name: "xReserve burn fee",
                            amount: "0",
                            token: "USDCx",
                            amountUsd: 0,
                        },
                    ],
                    steps: [
                        {
                            id: "step-canton-burn",
                            type: "bridgeSend",
                            description: `Burn ${amount} USDCx on Canton → release USDC on Ethereum`,
                            chainId: "canton",
                            tool: "Canton Ledger",
                            transactionData: {
                                serializedTransaction: JSON.stringify(burnCommand),
                            },
                        },
                        {
                            id: "step-eth-release",
                            type: "bridgeReceive",
                            description: `USDC released to ${ethRecipient} on Ethereum (≈10 min)`,
                            chainId: toChainId,
                            tool: "Canton xReserve",
                        },
                    ],
                };
            } catch (err) {
                return { success: false, error: `xReserve burn build failed: ${err instanceof Error ? err.message : String(err)}` };
            }
        }

        return {
            success: false,
            error: `Canton xReserve only supports ETH↔Canton routes. Got: ${fromChainId} → ${toChainId}`,
        };
    },
};
