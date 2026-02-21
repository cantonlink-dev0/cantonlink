// src/lib/providers/solanaConfig.ts
// Solana wallet adapter configuration
"use client";

import { clusterApiUrl } from "@solana/web3.js";

// Solana network endpoint
export const SOLANA_ENDPOINT =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    clusterApiUrl("mainnet-beta");

// Solana wallet adapter auto-detects installed wallets (Phantom, Solflare, etc.)
// No explicit wallet list needed with @solana/wallet-adapter-wallets
