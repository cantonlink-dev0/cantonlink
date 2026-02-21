// scripts/deploy-otc.ts
// Deploy the OTCEscrow contract and auto-update otcEscrowAbi.ts with the address.
//
// Usage:
//   npx hardhat run scripts/deploy-otc.ts --network arbitrum
//   npx hardhat run scripts/deploy-otc.ts --network base
//   npx hardhat run scripts/deploy-otc.ts --network polygon
//
// After each deploy, this script prints the deployed address.
// You MUST manually copy it into src/lib/contracts/otcEscrowAbi.ts
// (or run the auto-update command below).

import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("═══════════════════════════════════════════════════");
    console.log("  OTCEscrow Deployment");
    console.log("═══════════════════════════════════════════════════");

    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const chainId = Number(network.chainId);

    console.log(`\n  Network:  ${network.name} (chainId ${chainId})`);
    console.log(`  Deployer: ${deployer.address}`);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`  Balance:  ${ethers.formatEther(balance)} ETH\n`);

    if (balance === 0n) {
        console.error("❌ Deployer has no balance. Fund the wallet first.");
        process.exit(1);
    }

    // Deploy
    console.log("  Deploying OTCEscrow...");
    const OTCEscrow = await ethers.getContractFactory("OTCEscrow");
    const escrow = await OTCEscrow.deploy();
    await escrow.waitForDeployment();

    const deployedAddress = await escrow.getAddress();
    console.log(`\n  ✅ OTCEscrow deployed to: ${deployedAddress}`);
    console.log(`  🔗 Explorer: https://blockscan.com/address/${deployedAddress}\n`);

    // Auto-update the address file
    const abiFilePath = path.join(
        __dirname,
        "..",
        "src",
        "lib",
        "contracts",
        "otcEscrowAbi.ts"
    );

    try {
        let content = fs.readFileSync(abiFilePath, "utf-8");
        const chainIdStr = `"${chainId}"`;

        // Replace the null address for this chain
        const regex = new RegExp(`(${chainIdStr}:\\s*)null`, "g");
        if (regex.test(content)) {
            content = content.replace(regex, `$1"${deployedAddress}"`);
            fs.writeFileSync(abiFilePath, content, "utf-8");
            console.log(`  📝 Auto-updated ${abiFilePath}`);
            console.log(`     ${chainIdStr}: "${deployedAddress}"\n`);
        } else {
            console.log(`  ⚠️  Chain ${chainId} not found in file, or already set.`);
            console.log(`     Manually add: ${chainIdStr}: "${deployedAddress}"\n`);
        }
    } catch (err) {
        console.log(`  ⚠️  Could not auto-update ABI file: ${err}`);
        console.log(`     Manually add to otcEscrowAbi.ts:`);
        console.log(`     ${chainId}: "${deployedAddress}"\n`);
    }

    // Verify contract on explorer (if API key is set)
    console.log("  To verify on explorer:");
    console.log(`  npx hardhat verify --network ${network.name} ${deployedAddress}\n`);

    console.log("═══════════════════════════════════════════════════");
    console.log("  DEPLOYMENT COMPLETE");
    console.log("═══════════════════════════════════════════════════");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
