// src/lib/schemas/transaction.ts
// Zod schemas for transaction-related data

import { z } from "zod";

/** EVM transaction request shape. */
export const EvmTxRequestSchema = z.object({
    to: z.string(),
    data: z.string(),
    value: z.string().default("0"),
    gasLimit: z.string().optional(),
    /** EIP-1559 fields */
    maxFeePerGas: z.string().optional(),
    maxPriorityFeePerGas: z.string().optional(),
    /** Legacy gas price */
    gasPrice: z.string().optional(),
    chainId: z.number(),
});

export type EvmTxRequest = z.infer<typeof EvmTxRequestSchema>;

/** Solana transaction request shape (serialized transaction). */
export const SolanaTxRequestSchema = z.object({
    /** Base64-encoded serialized transaction from Jupiter or similar. */
    serializedTransaction: z.string(),
});

export type SolanaTxRequest = z.infer<typeof SolanaTxRequestSchema>;

/** Transaction receipt after execution. */
export const TxReceiptSchema = z.object({
    txHash: z.string(),
    chainId: z.string(),
    status: z.enum(["pending", "confirmed", "failed"]),
    blockNumber: z.number().optional(),
    gasUsed: z.string().optional(),
});

export type TxReceipt = z.infer<typeof TxReceiptSchema>;

/** ERC-20 approval check result. */
export const ApprovalCheckSchema = z.object({
    tokenAddress: z.string(),
    spender: z.string(),
    currentAllowance: z.string(),
    requiredAmount: z.string(),
    needsApproval: z.boolean(),
});

export type ApprovalCheck = z.infer<typeof ApprovalCheckSchema>;
