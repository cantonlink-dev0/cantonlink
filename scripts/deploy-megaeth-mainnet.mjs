// deploy-megaeth-mainnet.mjs — Deploy OTCEscrow to MegaETH MAINNET (chain 4326)
import { readFileSync, writeFileSync } from "fs";
import { ethers } from "ethers";

const artifact = JSON.parse(readFileSync("artifacts_hardhat/contracts/OTCEscrow.sol/OTCEscrow.json", "utf-8"));
const p = new ethers.JsonRpcProvider("https://mainnet.megaeth.com/rpc", 4326, { staticNetwork: true });
const w = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, p);

const bal = await p.getBalance(w.address);
console.log("Balance:", ethers.formatEther(bal), "ETH");

const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, w);
console.log("Deploying...");
const contract = await factory.deploy();
const tx = contract.deploymentTransaction();
console.log("TX:", tx.hash);
console.log("Waiting for confirmation...");

try {
    await Promise.race([
        contract.waitForDeployment(),
        new Promise((_, rej) => setTimeout(() => rej(new Error("receipt timeout 90s")), 90000))
    ]);
    const addr = await contract.getAddress();
    console.log("DEPLOYED:", addr);

    // Update otcEscrowAbi.ts — replace the old 6342 entry with 4326
    try {
        const f = "src/lib/contracts/otcEscrowAbi.ts";
        let content = readFileSync(f, "utf-8");
        // Replace "6342": null with "4326": "<addr>"
        content = content.replace(/"6342":\s*null,\s*\/\/\s*MegaETH/, `"4326": "${addr}",        // MegaETH`);
        writeFileSync(f, content, "utf-8");
        console.log("Updated otcEscrowAbi.ts (changed chain ID 6342 → 4326)");
    } catch (e) { console.log("ABI update error:", e.message); }
} catch (waitErr) {
    console.log("Receipt wait failed:", waitErr.message);
    console.log("TX was sent. Checking nonce...");
    const nonce = await p.getTransactionCount(w.address);
    if (nonce > 0) {
        const addr = ethers.getCreateAddress({ from: w.address, nonce: 0 });
        const code = await p.getCode(addr);
        if (code.length > 2) {
            console.log("CONTRACT IS LIVE AT:", addr);
            try {
                const f = "src/lib/contracts/otcEscrowAbi.ts";
                let content = readFileSync(f, "utf-8");
                content = content.replace(/"6342":\s*null,\s*\/\/\s*MegaETH/, `"4326": "${addr}",        // MegaETH`);
                writeFileSync(f, content, "utf-8");
                console.log("Updated otcEscrowAbi.ts");
            } catch (e) { }
        }
    }
}
