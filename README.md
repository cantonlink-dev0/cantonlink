# CantonLink

**Multi-chain DeFi swap & bridge — Canton Network first.**

CantonLink is a unified DeFi aggregation platform connecting 23 blockchains with a single interface, built with Canton Network as a first-class citizen.

## Features

- **Multi-Chain Swap** — Unified quotes across EVM, Solana, Sui & Canton
- **Cross-Chain Bridge** — LI.FI & deBridge powered bridging between 20+ chains
- **Canton Integration** — Native Canton wallet (DA Hub, Extension, JWT auth), swap & bridge adapters
- **OTC P2P Trading** — Trustless escrow contracts on EVM, Solana & Sui
- **Token Explorer** — Real-time market data via DexScreener (30+ pairs)
- **Walletless Quotes** — Get swap quotes without connecting a wallet

## Supported Chains

| EVM (20) | Non-EVM (3) |
|----------|-------------|
| Ethereum, BNB Chain, Polygon, Arbitrum, Optimism, Base, Avalanche, Fantom, Cronos, Gnosis, Linea, Mantle, Sei, Sonic, zkSync, Canto, BOB, Story, Blast, Berachain | Solana, Sui, **Canton Network** |

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Wallets**: Wagmi v2, RainbowKit, custom Canton provider
- **APIs**: ParaSwap, LI.FI, Jupiter, deBridge, DexScreener
- **Contracts**: Solidity (EVM OTC), Anchor/Rust (Solana OTC), Move (Sui OTC)
- **Validation**: Zod schemas on all API routes

## Architecture

```
src/
├── app/
│   ├── api/           # 11 API routes (quote, bridge, tokens, canton, dexscreener, etc.)
│   ├── legal/         # Terms of Service, Privacy Policy
│   └── page.tsx       # Home (Swap | OTC | Explore tabs)
├── components/        # UI components (SwapBridgeApp, OTC, TokenExplorer, etc.)
├── lib/
│   ├── adapters/      # 7 routing adapters (ParaSwap, LI.FI, Jupiter, Canton, Sui, etc.)
│   ├── canton/        # Canton ledger client, wallet hooks, attestation
│   ├── chains/        # Chain configuration (23 chains)
│   ├── hooks/         # React hooks (useQuote, useSwapExecution, useApproval, etc.)
│   └── routing/       # Multi-chain routing engine with mode enforcement
└── contracts/         # OTC escrow contracts (Solidity, Rust/Anchor, Move)
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev

# Production build
npm run build && npm start
```

## Environment Variables

Create `.env.local` with:

```env
PARASWAP_API_KEY=
LIFI_API_KEY=
DEBRIDGE_API_KEY=
JUPITER_API_URL=https://lite-api.jup.ag/swap/v1
HOUDINISWAP_API_URL=
HOUDINISWAP_API_KEY=
DEXSCREENER_API_URL=https://api.dexscreener.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

## Canton Network

CantonLink is built for the Canton Network ecosystem. Canton-specific features:

- **Canton Wallet** — 3 auth methods (DA Hub OIDC, Canton Extension, JWT)
- **Canton Swap Adapter** — Daml command execution via Ledger API
- **Canton Bridge Adapter** — Cross-domain transfer via reassignment
- **Canton Coin (CC)** — Native token support with USDC wrappers

> Canton mainnet access requires participant node credentials from the [Canton Foundation](https://canton.foundation).

## License

All rights reserved.
