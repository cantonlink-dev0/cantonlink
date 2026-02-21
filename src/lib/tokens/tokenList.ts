// src/lib/tokens/tokenList.ts
// Static typed token list. All addresses verified from official sources.
// Token logos from Trustwallet assets CDN + CoinGecko.

import { NATIVE_TOKEN_ADDRESS, SOLANA_CHAIN_ID, SUI_CHAIN_ID, CANTON_CHAIN_ID } from "@/lib/utils/constants";

export interface TokenInfo {
    chainId: string;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
}

// Trustwallet assets CDN base
const TW = "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains";

// Well-known token logo URLs
const LOGOS = {
    ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    WETH: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
    USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
    USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    DAI: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png",
    BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
    POL: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",

    SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
};

export const TOKEN_LIST: TokenInfo[] = [
    // ─── Ethereum (1) ───────────────────────────────────────────────
    {
        chainId: "1",
        address: NATIVE_TOKEN_ADDRESS,
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        logoURI: LOGOS.ETH,
    },
    {
        chainId: "1",
        address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        symbol: "WETH",
        name: "Wrapped Ether",
        decimals: 18,
        logoURI: LOGOS.WETH,
    },
    {
        chainId: "1",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logoURI: LOGOS.USDC,
    },
    {
        chainId: "1",
        address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        logoURI: LOGOS.USDT,
    },
    {
        chainId: "1",
        address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        symbol: "DAI",
        name: "Dai Stablecoin",
        decimals: 18,
        logoURI: LOGOS.DAI,
    },

    // ─── Arbitrum (42161) ───────────────────────────────────────────
    {
        chainId: "42161",
        address: NATIVE_TOKEN_ADDRESS,
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        logoURI: LOGOS.ETH,
    },
    {
        chainId: "42161",
        address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
        symbol: "WETH",
        name: "Wrapped Ether",
        decimals: 18,
        logoURI: LOGOS.WETH,
    },
    {
        chainId: "42161",
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logoURI: LOGOS.USDC,
    },
    {
        chainId: "42161",
        address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        logoURI: LOGOS.USDT,
    },

    // ─── Optimism (10) ──────────────────────────────────────────────
    {
        chainId: "10",
        address: NATIVE_TOKEN_ADDRESS,
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        logoURI: LOGOS.ETH,
    },
    {
        chainId: "10",
        address: "0x4200000000000000000000000000000000000006",
        symbol: "WETH",
        name: "Wrapped Ether",
        decimals: 18,
        logoURI: LOGOS.WETH,
    },
    {
        chainId: "10",
        address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logoURI: LOGOS.USDC,
    },
    {
        chainId: "10",
        address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        logoURI: LOGOS.USDT,
    },

    // ─── Base (8453) ────────────────────────────────────────────────
    {
        chainId: "8453",
        address: NATIVE_TOKEN_ADDRESS,
        symbol: "ETH",
        name: "Ether",
        decimals: 18,
        logoURI: LOGOS.ETH,
    },
    {
        chainId: "8453",
        address: "0x4200000000000000000000000000000000000006",
        symbol: "WETH",
        name: "Wrapped Ether",
        decimals: 18,
        logoURI: LOGOS.WETH,
    },
    {
        chainId: "8453",
        address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logoURI: LOGOS.USDC,
    },

    // ─── Polygon (137) ──────────────────────────────────────────────
    {
        chainId: "137",
        address: NATIVE_TOKEN_ADDRESS,
        symbol: "POL",
        name: "POL",
        decimals: 18,
        logoURI: LOGOS.POL,
    },
    {
        chainId: "137",
        address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
        symbol: "WETH",
        name: "Wrapped Ether",
        decimals: 18,
        logoURI: LOGOS.WETH,
    },
    {
        chainId: "137",
        address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logoURI: LOGOS.USDC,
    },
    {
        chainId: "137",
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        logoURI: LOGOS.USDT,
    },

    // ─── BNB Chain (56) ─────────────────────────────────────────────
    {
        chainId: "56",
        address: NATIVE_TOKEN_ADDRESS,
        symbol: "BNB",
        name: "BNB",
        decimals: 18,
        logoURI: LOGOS.BNB,
    },
    {
        chainId: "56",
        address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 18,
        logoURI: LOGOS.USDC,
    },
    {
        chainId: "56",
        address: "0x55d398326f99059fF775485246999027B3197955",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 18,
        logoURI: LOGOS.USDT,
    },

    // ─── Avalanche (43114) ──────────────────────────────────────────
    {
        chainId: "43114",
        address: NATIVE_TOKEN_ADDRESS,
        symbol: "AVAX",
        name: "Avalanche",
        decimals: 18,
        logoURI: LOGOS.AVAX,
    },
    {
        chainId: "43114",
        address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logoURI: LOGOS.USDC,
    },
    {
        chainId: "43114",
        address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        logoURI: LOGOS.USDT,
    },



    // ─── Solana ─────────────────────────────────────────────────────
    {
        chainId: SOLANA_CHAIN_ID,
        address: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        name: "Solana",
        decimals: 9,
        logoURI: LOGOS.SOL,
    },
    {
        chainId: SOLANA_CHAIN_ID,
        address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        symbol: "USDC",
        name: "USD Coin",
        decimals: 6,
        logoURI: LOGOS.USDC,
    },
    {
        chainId: SOLANA_CHAIN_ID,
        address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        symbol: "USDT",
        name: "Tether USD",
        decimals: 6,
        logoURI: LOGOS.USDT,
    },

    // ─── Sui ────────────────────────────────────────────────────────
    // Sui uses Move object type addresses (fully qualified module::type).
    // All addresses verified from suiscan.xyz / Sui Mainnet.
    {
        chainId: SUI_CHAIN_ID,
        address: "0x2::sui::SUI",
        symbol: "SUI",
        name: "Sui",
        decimals: 9,
        logoURI: "https://assets.coingecko.com/coins/images/26375/small/sui.png",
    },
    {
        chainId: SUI_CHAIN_ID,
        // USDC on Sui (Circle native, bridge via Wormhole)
        address: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
        symbol: "USDC",
        name: "USD Coin (Sui)",
        decimals: 6,
        logoURI: LOGOS.USDC,
    },
    {
        chainId: SUI_CHAIN_ID,
        // USDT on Sui (Wormhole bridged)
        address: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
        symbol: "USDT",
        name: "Tether USD (Sui)",
        decimals: 6,
        logoURI: LOGOS.USDT,
    },
    {
        chainId: SUI_CHAIN_ID,
        // WETH on Sui (Wormhole bridged)
        address: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
        symbol: "WETH",
        name: "Wrapped Ether (Sui)",
        decimals: 8,
        logoURI: LOGOS.WETH,
    },

    // ─── Canton ──────────────────────────────────────────────────────
    // Canton uses Daml contract IDs, not 0x addresses.
    // "canton:native" = Canton Coin (CC), the network's native token.
    // "canton:usdc"   = USDCx on Canton via Circle xReserve bridge (1:1 USDC).
    // "canton:usdt"   = USDT on Canton (Tether Canton deployment).
    {
        chainId: CANTON_CHAIN_ID,
        address: "canton:native",
        symbol: "CC",
        name: "Canton Coin",
        decimals: 10, // Canton uses 10 decimal places (CIP-0056)
        logoURI: "/chains/canton.svg",
    },
    {
        chainId: CANTON_CHAIN_ID,
        address: "canton:usdc",
        symbol: "USDCx",
        name: "USDCx (Canton xReserve)",
        decimals: 6,
        logoURI: LOGOS.USDC,
    },
    {
        chainId: CANTON_CHAIN_ID,
        address: "canton:usdt",
        symbol: "USDTx",
        name: "USDTx (Canton)",
        decimals: 6,
        logoURI: LOGOS.USDT,
    },
];

/** Get tokens for a specific chain. */
export function getTokensForChain(chainId: string | number): TokenInfo[] {
    return TOKEN_LIST.filter((t) => t.chainId === String(chainId));
}

/** Find a specific token by chainId + address. */
export function findToken(
    chainId: string | number,
    address: string
): TokenInfo | undefined {
    return TOKEN_LIST.find(
        (t) =>
            t.chainId === String(chainId) &&
            t.address.toLowerCase() === address.toLowerCase()
    );
}

/** Find a token by chainId + symbol. */
export function findTokenBySymbol(
    chainId: string | number,
    symbol: string
): TokenInfo | undefined {
    return TOKEN_LIST.find(
        (t) =>
            t.chainId === String(chainId) &&
            t.symbol.toUpperCase() === symbol.toUpperCase()
    );
}
