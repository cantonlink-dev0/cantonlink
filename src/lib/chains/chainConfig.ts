// src/lib/chains/chainConfig.ts
// All chains supported by deBridge — pulled directly from their API.
// Logos are real PNGs from CoinMarketCap in /public/chains/.

import { SOLANA_CHAIN_ID } from "@/lib/utils/constants";

export type ChainType = "evm" | "solana" | "sui" | "canton";

export interface ChainConfig {
    id: number | string;
    name: string;
    shortName: string;
    type: ChainType;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    rpcUrl: string;
    explorerUrl: string;
    logoColor: string;
    logoImage: string;
}

export const CHAINS: Record<string, ChainConfig> = {
    // ─── Tier 1: Major L1s ──────────────────────────────────────────────────
    "1": {
        id: 1,
        name: "Ethereum",
        shortName: "ETH",
        type: "evm",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrl: process.env.RPC_URL_1 || "https://eth.llamarpc.com",
        explorerUrl: "https://etherscan.io",
        logoColor: "#627EEA",
        logoImage: "/chains/ethereum.png",
    },
    "56": {
        id: 56,
        name: "BNB Chain",
        shortName: "BNB",
        type: "evm",
        nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
        rpcUrl: process.env.RPC_URL_56 || "https://bsc-dataseed.binance.org",
        explorerUrl: "https://bscscan.com",
        logoColor: "#F0B90B",
        logoImage: "/chains/bsc.png",
    },
    "137": {
        id: 137,
        name: "Polygon",
        shortName: "POL",
        type: "evm",
        nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
        rpcUrl: process.env.RPC_URL_137 || "https://polygon-rpc.com",
        explorerUrl: "https://polygonscan.com",
        logoColor: "#8247E5",
        logoImage: "/chains/polygon.png",
    },
    "43114": {
        id: 43114,
        name: "Avalanche",
        shortName: "AVAX",
        type: "evm",
        nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
        rpcUrl: process.env.RPC_URL_43114 || "https://api.avax.network/ext/bc/C/rpc",
        explorerUrl: "https://snowtrace.io",
        logoColor: "#E84142",
        logoImage: "/chains/avalanche.png",
    },


    // ─── Tier 2: Major L2s / Rollups ────────────────────────────────────────
    "42161": {
        id: 42161,
        name: "Arbitrum",
        shortName: "ARB",
        type: "evm",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrl: process.env.RPC_URL_42161 || "https://arb1.arbitrum.io/rpc",
        explorerUrl: "https://arbiscan.io",
        logoColor: "#28A0F0",
        logoImage: "/chains/arbitrum.png",
    },
    "10": {
        id: 10,
        name: "Optimism",
        shortName: "OP",
        type: "evm",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrl: process.env.RPC_URL_10 || "https://mainnet.optimism.io",
        explorerUrl: "https://optimistic.etherscan.io",
        logoColor: "#FF0420",
        logoImage: "/chains/optimism.png",
    },
    "8453": {
        id: 8453,
        name: "Base",
        shortName: "BASE",
        type: "evm",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrl: process.env.RPC_URL_8453 || "https://mainnet.base.org",
        explorerUrl: "https://basescan.org",
        logoColor: "#0052FF",
        logoImage: "/chains/base.png",
    },
    "59144": {
        id: 59144,
        name: "Linea",
        shortName: "LINEA",
        type: "evm",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrl: process.env.RPC_URL_59144 || "https://rpc.linea.build",
        explorerUrl: "https://lineascan.build",
        logoColor: "#61DFFF",
        logoImage: "/chains/linea.png",
    },
    "5000": {
        id: 5000,
        name: "Mantle",
        shortName: "MNT",
        type: "evm",
        nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
        rpcUrl: process.env.RPC_URL_5000 || "https://rpc.mantle.xyz",
        explorerUrl: "https://explorer.mantle.xyz",
        logoColor: "#000000",
        logoImage: "/chains/mantle.png",
    },
    "25": {
        id: 25,
        name: "Cronos",
        shortName: "CRO",
        type: "evm",
        nativeCurrency: { name: "Cronos", symbol: "CRO", decimals: 18 },
        rpcUrl: process.env.RPC_URL_25 || "https://evm.cronos.org",
        explorerUrl: "https://cronoscan.com",
        logoColor: "#002D74",
        logoImage: "/chains/cronos.png",
    },

    // ─── Tier 3: Next-gen / Emerging (on deBridge) ──────────────────────────
    "146": {
        id: 146,
        name: "Sonic",
        shortName: "SONIC",
        type: "evm",
        nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
        rpcUrl: process.env.RPC_URL_146 || "https://rpc.soniclabs.com",
        explorerUrl: "https://sonicscan.org",
        logoColor: "#0100EC",
        logoImage: "/chains/sonic.png",
    },
    "1329": {
        id: 1329,
        name: "Sei",
        shortName: "SEI",
        type: "evm",
        nativeCurrency: { name: "Sei", symbol: "SEI", decimals: 18 },
        rpcUrl: process.env.RPC_URL_1329 || "https://evm-rpc.sei-apis.com",
        explorerUrl: "https://seitrace.com",
        logoColor: "#9B1B30",
        logoImage: "/chains/sei.png",
    },
    "747": {
        id: 747,
        name: "Flow",
        shortName: "FLOW",
        type: "evm",
        nativeCurrency: { name: "Flow", symbol: "FLOW", decimals: 18 },
        rpcUrl: process.env.RPC_URL_747 || "https://mainnet.evm.nodes.onflow.org",
        explorerUrl: "https://evm.flowscan.io",
        logoColor: "#00EF8B",
        logoImage: "/chains/flow.png",
    },
    "1514": {
        id: 1514,
        name: "Story",
        shortName: "STORY",
        type: "evm",
        nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
        rpcUrl: process.env.RPC_URL_1514 || "https://mainnet.storyrpc.io",
        explorerUrl: "https://storyscan.xyz",
        logoColor: "#5E34FF",
        logoImage: "/chains/story.png",
    },
    "2741": {
        id: 2741,
        name: "Abstract",
        shortName: "ABS",
        type: "evm",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrl: process.env.RPC_URL_2741 || "https://api.mainnet.abs.xyz",
        explorerUrl: "https://abscan.org",
        logoColor: "#00C2FF",
        logoImage: "/chains/abstract.png",
    },
    "60808": {
        id: 60808,
        name: "BOB",
        shortName: "BOB",
        type: "evm",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrl: process.env.RPC_URL_60808 || "https://rpc.gobob.xyz",
        explorerUrl: "https://explorer.gobob.xyz",
        logoColor: "#F97316",
        logoImage: "/chains/bob.png",
    },
    "999": {
        id: 999,
        name: "Hyperliquid",
        shortName: "HYPE",
        type: "evm",
        nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
        rpcUrl: process.env.RPC_URL_999 || "https://rpc.hyperliquid.xyz/evm",
        explorerUrl: "https://hyperevm.cloud",
        logoColor: "#0EA5E9",
        logoImage: "/chains/hyperliquid.png",
    },
    "9745": {
        id: 9745,
        name: "Plasma",
        shortName: "PLASMA",
        type: "evm",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrl: process.env.RPC_URL_9745 || "https://rpc.plasma.build",
        explorerUrl: "https://explorer.plasma.build",
        logoColor: "#6C3BF5",
        logoImage: "/chains/plasma.png",
    },
    "143": {
        id: 143,
        name: "Monad",
        shortName: "MON",
        type: "evm",
        nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
        rpcUrl: process.env.RPC_URL_143 || "https://rpc.monad.xyz",
        explorerUrl: "https://explorer.monad.xyz",
        logoColor: "#836EF9",
        logoImage: "/chains/monad.png",
    },
    "4326": {
        id: 4326,
        name: "MegaETH",
        shortName: "MEGA",
        type: "evm",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrl: process.env.RPC_URL_4326 || "https://mainnet.megaeth.com/rpc",
        explorerUrl: "https://megaexplorer.xyz",
        logoColor: "#FF6B35",
        logoImage: "/chains/megaeth.png",
    },

    // ─── Non-EVM ────────────────────────────────────────────────────────────
    [SOLANA_CHAIN_ID]: {
        id: SOLANA_CHAIN_ID,
        name: "Solana",
        shortName: "SOL",
        type: "solana",
        nativeCurrency: { name: "SOL", symbol: "SOL", decimals: 9 },
        rpcUrl:
            process.env.SOLANA_RPC_URL ||
            "https://api.mainnet-beta.solana.com",
        explorerUrl: "https://solscan.io",
        logoColor: "#9945FF",
        logoImage: "/chains/solana.png",
    },

    // ─── Sui ─────────────────────────────────────────────────────────────
    sui: {
        id: "sui",
        name: "Sui",
        shortName: "SUI",
        type: "sui",
        nativeCurrency: { name: "Sui", symbol: "SUI", decimals: 9 },
        rpcUrl: process.env.SUI_RPC_URL || "https://fullnode.mainnet.sui.io",
        explorerUrl: "https://suiscan.xyz",
        logoColor: "#4DA2FF",
        logoImage: "/chains/sui.png",
    },

    // ─── Canton ───────────────────────────────────────────────────────────
    canton: {
        id: "canton",
        name: "Canton",
        shortName: "CC",
        type: "canton",
        nativeCurrency: { name: "Canton Coin", symbol: "CC", decimals: 10 },
        rpcUrl: process.env.CANTON_RPC_URL || "https://canton.network",
        explorerUrl: "https://scan.canton.network",
        logoColor: "#06FC99",
        logoImage: "/chains/canto.png",
    },

};

/** Ordered list of chain IDs for UI selectors. */
export const CHAIN_IDS = Object.keys(CHAINS);

/** EVM-only chain IDs (numeric). */
export const EVM_CHAIN_IDS = CHAIN_IDS.filter(
    (id) => CHAINS[id].type === "evm"
);

/** Helper to check if a chain is EVM. */
export function isEvmChain(chainId: string | number): boolean {
    const id = String(chainId);
    return CHAINS[id]?.type === "evm";
}

/** Helper to check if a chain is Solana. */
export function isSolanaChain(chainId: string | number): boolean {
    return String(chainId) === SOLANA_CHAIN_ID;
}

/** Helper to check if a chain is Canton. */
export function isCantonChain(chainId: string | number): boolean {
    return String(chainId) === "canton";
}

/** Helper to check if a chain is Sui. */
export function isSuiChain(chainId: string | number): boolean {
    return String(chainId) === "sui";
}

/** Get chain config by ID, or undefined. */
export function getChain(chainId: string | number): ChainConfig | undefined {
    return CHAINS[String(chainId)];
}
