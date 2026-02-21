// src/lib/contracts/otcEscrowAbi.ts
// ABI and addresses for the OTCEscrow smart contract.
// Deploy the contract from contracts/OTCEscrow.sol, then add addresses here.

export const OTC_ESCROW_ABI = [
    // ─── Write Functions ─────────────────────────────────────────────────────
    {
        name: "createOrder",
        type: "function",
        stateMutability: "payable",
        inputs: [
            { name: "_sellToken", type: "address" },
            { name: "_sellAmount", type: "uint256" },
            { name: "_buyToken", type: "address" },
            { name: "_buyAmount", type: "uint256" },
            { name: "_expiry", type: "uint256" },
            { name: "_allowedTaker", type: "address" },
        ],
        outputs: [{ name: "orderId", type: "uint256" }],
    },
    {
        name: "fillOrder",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "_orderId", type: "uint256" }],
        outputs: [],
    },
    {
        name: "cancelOrder",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "_orderId", type: "uint256" }],
        outputs: [],
    },

    // ─── Read Functions ──────────────────────────────────────────────────────
    {
        name: "orderCount",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "getOrder",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "_orderId", type: "uint256" }],
        outputs: [
            { name: "maker", type: "address" },
            { name: "sellToken", type: "address" },
            { name: "sellAmount", type: "uint256" },
            { name: "buyToken", type: "address" },
            { name: "buyAmount", type: "uint256" },
            { name: "expiry", type: "uint256" },
            { name: "allowedTaker", type: "address" },
            { name: "status", type: "uint8" },
            { name: "taker", type: "address" },
        ],
    },
    {
        name: "orders",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "", type: "uint256" }],
        outputs: [
            { name: "maker", type: "address" },
            { name: "sellToken", type: "address" },
            { name: "sellAmount", type: "uint256" },
            { name: "buyToken", type: "address" },
            { name: "buyAmount", type: "uint256" },
            { name: "expiry", type: "uint256" },
            { name: "allowedTaker", type: "address" },
            { name: "status", type: "uint8" },
            { name: "taker", type: "address" },
        ],
    },

    // ─── Events ──────────────────────────────────────────────────────────────
    {
        name: "OrderCreated",
        type: "event",
        inputs: [
            { name: "orderId", type: "uint256", indexed: true },
            { name: "maker", type: "address", indexed: true },
            { name: "sellToken", type: "address", indexed: false },
            { name: "sellAmount", type: "uint256", indexed: false },
            { name: "buyToken", type: "address", indexed: false },
            { name: "buyAmount", type: "uint256", indexed: false },
            { name: "expiry", type: "uint256", indexed: false },
            { name: "allowedTaker", type: "address", indexed: false },
        ],
    },
    {
        name: "OrderFilled",
        type: "event",
        inputs: [
            { name: "orderId", type: "uint256", indexed: true },
            { name: "taker", type: "address", indexed: true },
            { name: "sellAmount", type: "uint256", indexed: false },
            { name: "buyAmount", type: "uint256", indexed: false },
        ],
    },
    {
        name: "OrderCancelled",
        type: "event",
        inputs: [
            { name: "orderId", type: "uint256", indexed: true },
        ],
    },

    // ─── Errors ──────────────────────────────────────────────────────────────
    { name: "OrderNotOpen", type: "error", inputs: [] },
    { name: "OrderExpired", type: "error", inputs: [] },
    { name: "NotMaker", type: "error", inputs: [] },
    { name: "NotAllowedTaker", type: "error", inputs: [] },
    { name: "IncorrectETHAmount", type: "error", inputs: [] },
    { name: "CannotFillOwnOrder", type: "error", inputs: [] },
] as const;

/**
 * Deployed contract addresses per chain.
 * Add addresses here after deploying the OTCEscrow contract.
 * Key = chainId string, value = contract address.
 */
export const OTC_ESCROW_ADDRESSES: Record<string, `0x${string}` | null> = {
    // ─── Tier 1: L1 Majors ──────────────────────────────────────────
    "1": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",           // Ethereum
    "56": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",          // BNB Chain
    "137": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",         // Polygon
    "43114": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",       // Avalanche

    // ─── Tier 2: L2s / Rollups ──────────────────────────────────────
    "42161": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",       // Arbitrum
    "10": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",          // Optimism
    "8453": "0x6d4a3b9F478400DBd6B4110a4ac6E769195C4859",        // Base
    "59144": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",       // Linea
    "5000": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",        // Mantle
    "25": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",          // Cronos

    // ─── Tier 3: Next-Gen / Emerging ────────────────────────────────
    "146": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",         // Sonic
    "1329": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",        // Sei
    "747": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",         // Flow
    "1514": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",        // Story
    "2741": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",        // Abstract
    "60808": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",       // BOB
    "999": "0x21C0073Cc11296104eF99E5F69Ff2A7c7B8fbD41",         // HyperEVM
    "9745": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",        // Plasma
    "143": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",         // Monad
    "4326": "0x8DCB419C1479b70B2BdB57cf5482cbf33E5E7f40",        // MegaETH
};

/**
 * Check if OTC escrow is deployed on a given chain.
 */
export function isOTCDeployed(chainId: string): boolean {
    return OTC_ESCROW_ADDRESSES[chainId] != null;
}

/**
 * Get the escrow contract address for a chain. Throws if not deployed.
 */
export function getOTCAddress(chainId: string): `0x${string}` {
    const addr = OTC_ESCROW_ADDRESSES[chainId];
    if (!addr) {
        throw new Error(`OTC escrow not deployed on chain ${chainId}`);
    }
    return addr;
}

/** ERC-20 approve ABI — needed to approve tokens before createOrder/fillOrder */
export const ERC20_APPROVE_ABI = [
    {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        name: "allowance",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },
] as const;
