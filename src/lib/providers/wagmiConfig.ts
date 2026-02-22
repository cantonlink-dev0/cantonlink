// src/lib/providers/wagmiConfig.ts
// wagmi + viem configuration — all deBridge chains
"use client";

import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
    metaMaskWallet,
    rainbowWallet,
    coinbaseWallet,
    walletConnectWallet,
    trustWallet,
    ledgerWallet,
    braveWallet,
    rabbyWallet,
    zerionWallet,
    argentWallet,
    safeWallet,
    frameWallet,
    tahoWallet,
    okxWallet,
    bitgetWallet,
    gateWallet,
    binanceWallet,
    krakenWallet,
} from "@rainbow-me/rainbowkit/wallets";
// NOTE: phantomWallet removed — it uses window.phantom.ethereum (EVM mode)
// which conflicts with MetaMask and hangs. Phantom is Solana-only in this app.
import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import {
    mainnet,
    arbitrum,
    optimism,
    base,
    polygon,
    bsc,
    avalanche,
    linea,
    mantle,
    cronos,
    sei,
} from "wagmi/chains";

// ─── Custom chain definitions (not in wagmi/chains) ─────────────────────────



export const sonic = defineChain({
    id: 146,
    name: "Sonic",
    nativeCurrency: { name: "Sonic", symbol: "S", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.soniclabs.com"] } },
    blockExplorers: { default: { name: "SonicScan", url: "https://sonicscan.org" } },
});

export const flowEvm = defineChain({
    id: 747,
    name: "Flow",
    nativeCurrency: { name: "Flow", symbol: "FLOW", decimals: 18 },
    rpcUrls: { default: { http: ["https://mainnet.evm.nodes.onflow.org"] } },
    blockExplorers: { default: { name: "FlowScan", url: "https://evm.flowscan.io" } },
});

export const story = defineChain({
    id: 1514,
    name: "Story",
    nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
    rpcUrls: { default: { http: ["https://mainnet.storyrpc.io"] } },
    blockExplorers: { default: { name: "StoryScan", url: "https://storyscan.xyz" } },
});

export const abstract_ = defineChain({
    id: 2741,
    name: "Abstract",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://api.mainnet.abs.xyz"] } },
    blockExplorers: { default: { name: "AbScan", url: "https://abscan.org" } },
});

export const bob = defineChain({
    id: 60808,
    name: "BOB",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.gobob.xyz"] } },
    blockExplorers: { default: { name: "BOB Explorer", url: "https://explorer.gobob.xyz" } },
});

export const hyperEvm = defineChain({
    id: 999,
    name: "HyperEVM",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.hyperliquid.xyz/evm"] } },
    blockExplorers: { default: { name: "HyperEVM", url: "https://hyperevm.cloud" } },
});

export const plasma = defineChain({
    id: 9745,
    name: "Plasma",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.plasma.build"] } },
    blockExplorers: { default: { name: "Plasma", url: "https://explorer.plasma.build" } },
});

export const monad = defineChain({
    id: 143,
    name: "Monad",
    nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: ["https://rpc.monad.xyz"] } },
    blockExplorers: { default: { name: "Monad", url: "https://explorer.monad.xyz" } },
});

export const megaeth = defineChain({
    id: 4326,
    name: "MegaETH",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: ["https://mainnet.megaeth.com/rpc"] } },
    blockExplorers: { default: { name: "MegaETH", url: "https://megaexplorer.xyz" } },
});

// ───  Config ─────────────────────────────────────────────────────────────────

const allChains = [
    // Tier 1
    mainnet, bsc, polygon, avalanche,
    // Tier 2
    arbitrum, optimism, base, linea, mantle, cronos,
    // Tier 3
    sonic, sei, flowEvm, story, abstract_, bob,
    hyperEvm, plasma, monad, megaeth,
] as const;

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "3fbb6bba6f1de962d911bb5b5c9dba88";

// Configure all popular wallets with their official logos
const connectors = connectorsForWallets(
    [
        {
            groupName: "Popular",
            wallets: [
                metaMaskWallet,
                rainbowWallet,
                coinbaseWallet,
                trustWallet,
                rabbyWallet,
                zerionWallet,
            ],
        },
        {
            groupName: "More Wallets",
            wallets: [
                walletConnectWallet,
                ledgerWallet,
                braveWallet,
                argentWallet,
                safeWallet,
                frameWallet,
                tahoWallet,
                okxWallet,
                bitgetWallet,
                gateWallet,
                binanceWallet,
                krakenWallet,
            ],
        },
    ],
    {
        appName: "CantonLink",
        projectId,
    }
);

export const wagmiConfig = createConfig({
    connectors,
    chains: allChains as any,
    transports: Object.fromEntries(
        allChains.map((chain) => [chain.id, http()])
    ) as Record<number, ReturnType<typeof http>>,
    ssr: true,
});
