// deploy-direct.mjs — Deploy OTCEscrow to all 21 EVM chains using raw ethers.js
// No Hardhat runtime needed — reads the pre-compiled artifact directly.
//
// Usage: DEPLOYER_PRIVATE_KEY=0x... node scripts/deploy-direct.mjs

import { readFileSync, readFileSync as rf, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Load compiled artifact
const artifact = JSON.parse(
    readFileSync(join(ROOT, "artifacts_hardhat", "contracts", "OTCEscrow.sol", "OTCEscrow.json"), "utf-8")
);

const PK = process.env.DEPLOYER_PRIVATE_KEY;
if (!PK) {
    console.error("Set DEPLOYER_PRIVATE_KEY env var first");
    process.exit(1);
}

// All 21 EVM chains
const chains = [
    { name: "Ethereum", chainId: "1", rpc: "https://eth.llamarpc.com" },
    { name: "BNB Chain", chainId: "56", rpc: "https://bsc-dataseed1.binance.org" },
    { name: "Polygon", chainId: "137", rpc: "https://polygon-bor-rpc.publicnode.com" },
    { name: "Avalanche", chainId: "43114", rpc: "https://api.avax.network/ext/bc/C/rpc" },
    { name: "Arbitrum", chainId: "42161", rpc: "https://arb1.arbitrum.io/rpc" },
    { name: "Optimism", chainId: "10", rpc: "https://mainnet.optimism.io" },
    { name: "Base", chainId: "8453", rpc: "https://mainnet.base.org" },
    { name: "Linea", chainId: "59144", rpc: "https://rpc.linea.build" },
    { name: "Mantle", chainId: "5000", rpc: "https://rpc.mantle.xyz" },
    { name: "Cronos", chainId: "25", rpc: "https://evm.cronos.org" },
    { name: "Sonic", chainId: "146", rpc: "https://rpc.soniclabs.com" },
    { name: "Berachain", chainId: "80094", rpc: "https://rpc.berachain.com" },
    { name: "Sei", chainId: "1329", rpc: "https://evm-rpc.sei-apis.com" },
    { name: "Flow", chainId: "747", rpc: "https://mainnet.evm.nodes.onflow.org" },
    { name: "Story", chainId: "1514", rpc: "https://mainnet.storyrpc.io" },
    { name: "Abstract", chainId: "2741", rpc: "https://api.mainnet.abs.xyz" },
    { name: "BOB", chainId: "60808", rpc: "https://rpc.gobob.xyz" },
    { name: "HyperEVM", chainId: "999", rpc: "https://rpc.hyperliquid.xyz/evm" },
    { name: "Plasma", chainId: "9745", rpc: "https://rpc.plasma.to" },
    { name: "Monad", chainId: "143", rpc: "https://monad-mainnet.drpc.org" },
    { name: "MegaETH", chainId: "6342", rpc: "https://6342.rpc.thirdweb.com" },
];

const deployed = [];
const failed = [];

console.log("═".repeat(60));
console.log("  OTCEscrow — Deploy to 21 EVM Chains");
console.log("═".repeat(60));
console.log("");

for (let i = 0; i < chains.length; i++) {
    const c = chains[i];
    console.log(`[${i + 1}/${chains.length}] ${c.name} (chainId ${c.chainId})`);

    try {
        const provider = new ethers.JsonRpcProvider(c.rpc, parseInt(c.chainId));
        const wallet = new ethers.Wallet(PK, provider);

        const balance = await provider.getBalance(wallet.address);
        const balStr = ethers.formatEther(balance);
        console.log(`    Wallet: ${wallet.address}`);
        console.log(`    Balance: ${balStr}`);

        if (balance === 0n) {
            console.log(`    ⚠ NO FUNDS — skipping`);
            failed.push({ name: c.name, reason: "no funds" });
            console.log("");
            continue;
        }

        // Deploy
        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
        console.log("    Deploying...");
        const contract = await factory.deploy();
        const tx = contract.deploymentTransaction();
        console.log(`    TX: ${tx.hash}`);
        console.log("    Waiting for confirmation...");
        await contract.waitForDeployment();
        const addr = await contract.getAddress();

        console.log(`    ✅ DEPLOYED: ${addr}`);
        deployed.push({ name: c.name, chainId: c.chainId, address: addr, tx: tx.hash });

        // Auto-update otcEscrowAbi.ts
        try {
            const abiFile = join(ROOT, "src", "lib", "contracts", "otcEscrowAbi.ts");
            let content = readFileSync(abiFile, "utf-8");
            const regex = new RegExp(`("${c.chainId}":\\s*)null`);
            if (regex.test(content)) {
                content = content.replace(regex, `$1"${addr}"`);
                writeFileSync(abiFile, content, "utf-8");
                console.log(`    📝 Updated otcEscrowAbi.ts`);
            }
        } catch (e) {
            console.log(`    ⚠ Could not update ABI file: ${e.message}`);
        }
    } catch (err) {
        console.log(`    ❌ FAILED: ${err.message?.substring(0, 120)}`);
        failed.push({ name: c.name, reason: err.message?.substring(0, 120) });
    }
    console.log("");
}

// Summary
console.log("═".repeat(60));
console.log("  DEPLOY SUMMARY");
console.log("═".repeat(60));
console.log("");

if (deployed.length > 0) {
    console.log(`✅ Deployed (${deployed.length} chains):`);
    for (const d of deployed) {
        console.log(`   ${d.name.padEnd(15)} chainId ${d.chainId.padEnd(8)} → ${d.address}`);
    }
}
console.log("");
if (failed.length > 0) {
    console.log(`❌ Failed (${failed.length} chains):`);
    for (const f of failed) {
        console.log(`   ${f.name.padEnd(15)} — ${f.reason}`);
    }
}
console.log("");
console.log("═".repeat(60));
