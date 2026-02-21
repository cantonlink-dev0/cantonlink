// deploy-last2.mjs — Deploy OTCEscrow to Abstract and MegaETH
import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const artifact = JSON.parse(
    readFileSync(join(ROOT, "artifacts_hardhat", "contracts", "OTCEscrow.sol", "OTCEscrow.json"), "utf-8")
);
const PK = process.env.DEPLOYER_PRIVATE_KEY;

const chains = [
    { name: "Abstract", chainId: "2741", rpc: "https://api.mainnet.abs.xyz" },
    { name: "MegaETH", chainId: "6342", rpc: "https://6342.rpc.thirdweb.com" },
];

for (const c of chains) {
    console.log(`--- ${c.name} (chainId ${c.chainId}) ---`);
    try {
        const p = new ethers.JsonRpcProvider(c.rpc, parseInt(c.chainId), { staticNetwork: true, batchMaxCount: 1 });
        const w = new ethers.Wallet(PK, p);
        const bal = await p.getBalance(w.address);
        console.log(`  Balance: ${ethers.formatEther(bal)}`);
        if (bal === 0n) { console.log("  NO FUNDS - skip"); console.log(""); continue; }

        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, w);
        console.log("  Deploying...");
        const contract = await factory.deploy();
        const tx = contract.deploymentTransaction();
        console.log(`  TX: ${tx.hash}`);

        await Promise.race([
            contract.waitForDeployment(),
            new Promise((_, rej) => setTimeout(() => rej(new Error("timeout 60s")), 60000))
        ]);
        const addr = await contract.getAddress();
        console.log(`  ✅ DEPLOYED: ${addr}`);

        // Auto-update otcEscrowAbi.ts
        try {
            const f = join(ROOT, "src", "lib", "contracts", "otcEscrowAbi.ts");
            let content = readFileSync(f, "utf-8");
            const re = new RegExp(`("${c.chainId}":\\s*)null`);
            if (re.test(content)) {
                content = content.replace(re, `$1"${addr}"`);
                writeFileSync(f, content, "utf-8");
                console.log("  📝 Updated otcEscrowAbi.ts");
            }
        } catch (e) { /* ignore */ }
    } catch (e) {
        console.log(`  ❌ FAILED: ${(e.message || "").substring(0, 150)}`);
    }
    console.log("");
}
