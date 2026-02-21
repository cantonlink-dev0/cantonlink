// src/lib/adapters/evm/approvalHelper.ts
// ERC-20 allowance checking and approval transaction building

import { NATIVE_TOKEN_ADDRESS } from "@/lib/utils/constants";

// Standard ERC-20 ABI fragments for allowance + approve
const ERC20_ABI = {
    allowance: {
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        name: "allowance",
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    approve: {
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
} as const;

/**
 * Check if an ERC-20 token needs approval for a spender.
 * Returns the current allowance and whether approval is required.
 *
 * NOTE: This function is designed to be called via the API route,
 * which can make RPC calls server-side. On the client, use the
 * useApproval hook which uses wagmi's readContract.
 */
export function isNativeToken(tokenAddress: string): boolean {
    return (
        tokenAddress.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ||
        tokenAddress === "0x0000000000000000000000000000000000000000"
    );
}

/**
 * Build the approval transaction calldata.
 * Uses max uint256 approval by default (common pattern for DEX approvals).
 */
export function buildApprovalData(
    spenderAddress: string,
    amount?: string
): { functionName: string; args: [string, bigint] } {
    const approvalAmount = amount
        ? BigInt(amount)
        : BigInt(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        ); // max uint256

    return {
        functionName: "approve",
        args: [spenderAddress, approvalAmount],
    };
}

/**
 * Get the ERC20 ABI fragment needed for viem/wagmi contract calls.
 */
export function getErc20Abi() {
    return [
        {
            inputs: [
                { name: "owner", type: "address" as const },
                { name: "spender", type: "address" as const },
            ],
            name: "allowance" as const,
            outputs: [{ name: "" as const, type: "uint256" as const }],
            stateMutability: "view" as const,
            type: "function" as const,
        },
        {
            inputs: [
                { name: "spender", type: "address" as const },
                { name: "amount", type: "uint256" as const },
            ],
            name: "approve" as const,
            outputs: [{ name: "" as const, type: "bool" as const }],
            stateMutability: "nonpayable" as const,
            type: "function" as const,
        },
        {
            inputs: [{ name: "account", type: "address" as const }],
            name: "balanceOf" as const,
            outputs: [{ name: "" as const, type: "uint256" as const }],
            stateMutability: "view" as const,
            type: "function" as const,
        },
        {
            inputs: [],
            name: "decimals" as const,
            outputs: [{ name: "" as const, type: "uint8" as const }],
            stateMutability: "view" as const,
            type: "function" as const,
        },
        {
            inputs: [],
            name: "symbol" as const,
            outputs: [{ name: "" as const, type: "string" as const }],
            stateMutability: "view" as const,
            type: "function" as const,
        },
    ] as const;
}
