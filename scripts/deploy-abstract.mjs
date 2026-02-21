// deploy-abstract.mjs — Deploy OTCEscrow to Abstract
import { readFileSync, writeFileSync } from "fs";
import { ethers } from "ethers";

const artifact = JSON.parse(readFileSync("artifacts_hardhat/contracts/OTCEscrow.sol/OTCEscrow.json", "utf-8"));
const p = new ethers.JsonRpcProvider("https://api.mainnet.abs.xyz", 2741, { staticNetwork: true });
const w = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, p);

const bal = await p.getBalance(w.address);
console.log("Balance:", ethers.formatEther(bal), "ETH");

const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, w);
console.log("Deploying...");
const contract = await factory.deploy();
const tx = contract.deploymentTransaction();
console.log("TX:", tx.hash);
console.log("Waiting for confirmation...");
await contract.waitForDeployment();
const addr = await contract.getAddress();
console.log("DEPLOYED:", addr);

// Auto-update otcEscrowAbi.ts
try {
    const f = "src/lib/contracts/otcEscrowAbi.ts";
    let content = readFileSync(f, "utf-8");
    const re = new RegExp('("2741":\\s*)null');
    if (re.test(content)) {
        content = content.replace(re, `$1"${addr}"`);
        writeFileSync(f, content, "utf-8");
        console.log("Updated otcEscrowAbi.ts");
    }
} catch (e) { console.log("Could not update ABI file:", e.message); }
