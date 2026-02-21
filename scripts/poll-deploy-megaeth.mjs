// poll-deploy-megaeth.mjs — Poll for MegaETH balance and deploy when funds arrive
import { readFileSync, writeFileSync } from "fs";
import { ethers } from "ethers";

const artifact = JSON.parse(readFileSync("artifacts_hardhat/contracts/OTCEscrow.sol/OTCEscrow.json", "utf-8"));
const PK = process.env.DEPLOYER_PRIVATE_KEY;
const p = new ethers.JsonRpcProvider("https://carrot.megaeth.com/rpc", 6342, { staticNetwork: true });
const w = new ethers.Wallet(PK, p);

console.log("Wallet:", w.address);
console.log("Polling MegaETH balance every 10s...\n");

for (let attempt = 1; attempt <= 60; attempt++) {
    try {
        const bal = await p.getBalance(w.address);
        const balStr = ethers.formatEther(bal);
        const now = new Date().toLocaleTimeString();
        process.stdout.write(`[${now}] Attempt ${attempt}/60 — Balance: ${balStr} ETH`);

        if (bal > 0n) {
            console.log(" ✅ FUNDS DETECTED!\n");

            // Deploy immediately
            const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, w);
            console.log("Deploying OTCEscrow...");
            const contract = await factory.deploy();
            const tx = contract.deploymentTransaction();
            console.log("TX:", tx.hash);

            // Wait with timeout
            try {
                await Promise.race([
                    contract.waitForDeployment(),
                    new Promise((_, rej) => setTimeout(() => rej(new Error("receipt timeout 90s")), 90000))
                ]);
                const addr = await contract.getAddress();
                console.log("\n✅ MEGAETH DEPLOYED:", addr);

                // Update otcEscrowAbi.ts
                try {
                    const f = "src/lib/contracts/otcEscrowAbi.ts";
                    let content = readFileSync(f, "utf-8");
                    const re = new RegExp('("6342":\\s*)null');
                    if (re.test(content)) {
                        content = content.replace(re, `$1"${addr}"`);
                        writeFileSync(f, content, "utf-8");
                        console.log("📝 Updated otcEscrowAbi.ts");
                    }
                } catch (e) { }
            } catch (waitErr) {
                // TX was sent, check manually
                console.log("\n⏳ TX sent but receipt timed out. TX hash:", tx.hash);
                console.log("Check nonce to verify...");
                const nonce = await p.getTransactionCount(w.address);
                if (nonce > 0) {
                    const addr = ethers.getCreateAddress({ from: w.address, nonce: 0 });
                    const code = await p.getCode(addr);
                    if (code.length > 2) {
                        console.log("✅ CONTRACT IS LIVE AT:", addr);
                        try {
                            const f = "src/lib/contracts/otcEscrowAbi.ts";
                            let content = readFileSync(f, "utf-8");
                            content = content.replace(/("6342":\s*)null/, `$1"${addr}"`);
                            writeFileSync(f, content, "utf-8");
                            console.log("📝 Updated otcEscrowAbi.ts");
                        } catch (e) { }
                    }
                }
            }
            process.exit(0);
        } else {
            console.log(" — waiting...\r");
        }
    } catch (e) {
        console.log(`[Attempt ${attempt}] RPC error: ${(e.message || "").substring(0, 60)}`);
    }
    await new Promise(r => setTimeout(r, 10000));
}

console.log("\n⚠ Gave up after 10 minutes. Bridge deposit may take longer.");
console.log("Run this script again later: node scripts/poll-deploy-megaeth.mjs");
