// hardhat.config.ts
// Deploy the OTCEscrow contract to ALL 21 EVM chains
// Usage:
//   npx hardhat compile
//   npx hardhat run scripts/deploy-otc.ts --network arbitrum

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Private key for deployment — NEVER commit this
// Set via: $env:DEPLOYER_PRIVATE_KEY="0x..."
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";

// Helper to create network config (Hardhat 3.x requires type: "http")
function net(url: string, chainId: number) {
    return {
        type: "http" as const,
        url,
        chainId,
        accounts: [DEPLOYER_KEY],
    };
}

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },

    paths: {
        sources: "./contracts",
        cache: "./cache_hardhat",
        artifacts: "./artifacts_hardhat",
    },

    networks: {
        // ═══════════════════════════════════════════════════════════════
        //  TIER 1: L1 Majors
        // ═══════════════════════════════════════════════════════════════
        ethereum: net("https://eth.llamarpc.com", 1),
        bsc: net("https://bsc-dataseed1.binance.org", 56),
        polygon: net("https://polygon-bor-rpc.publicnode.com", 137),
        avalanche: net("https://api.avax.network/ext/bc/C/rpc", 43114),

        // ═══════════════════════════════════════════════════════════════
        //  TIER 2: Major L2s / Rollups
        // ═══════════════════════════════════════════════════════════════
        arbitrum: net("https://arb1.arbitrum.io/rpc", 42161),
        optimism: net("https://mainnet.optimism.io", 10),
        base: net("https://mainnet.base.org", 8453),
        linea: net("https://rpc.linea.build", 59144),
        mantle: net("https://rpc.mantle.xyz", 5000),
        cronos: net("https://evm.cronos.org", 25),

        // ═══════════════════════════════════════════════════════════════
        //  TIER 3: Next-Gen / Emerging
        // ═══════════════════════════════════════════════════════════════
        sonic: net("https://rpc.soniclabs.com", 146),
        sei: net("https://evm-rpc.sei-apis.com", 1329),
        flow: net("https://mainnet.evm.nodes.onflow.org", 747),
        story: net("https://mainnet.storyrpc.io", 1514),
        abstract: net("https://api.mainnet.abs.xyz", 2741),
        bob: net("https://rpc.gobob.xyz", 60808),
        hyperevm: net("https://rpc.hyperliquid.xyz/evm", 999),
        plasma: net("https://rpc.plasma.to", 9745),
        monad: net("https://monad-mainnet.drpc.org", 143),
        megaeth: net("https://mainnet.megaeth.com/rpc", 4326),

        // ═══════════════════════════════════════════════════════════════
        //  TESTNETS
        // ═══════════════════════════════════════════════════════════════
        sepolia: net("https://rpc.sepolia.org", 11155111),
        arbitrumSepolia: net("https://sepolia-rollup.arbitrum.io/rpc", 421614),
        baseSepolia: net("https://sepolia.base.org", 84532),
    },
};

export default config;
