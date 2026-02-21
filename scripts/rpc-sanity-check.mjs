// scripts/rpc-sanity-check.mjs
// Tests every RPC endpoint to verify it's live and returns the correct chainId.
// Usage: node scripts/rpc-sanity-check.mjs

const chains = [
    { name: "Ethereum", url: "https://eth.llamarpc.com", expected: 1 },
    { name: "BNB Chain", url: "https://bsc-dataseed1.binance.org", expected: 56 },
    { name: "Polygon", url: "https://polygon-rpc.com", expected: 137 },
    { name: "Avalanche", url: "https://api.avax.network/ext/bc/C/rpc", expected: 43114 },
    { name: "Fantom", url: "https://rpc.ftm.tools", expected: 250 },
    { name: "Arbitrum", url: "https://arb1.arbitrum.io/rpc", expected: 42161 },
    { name: "Optimism", url: "https://mainnet.optimism.io", expected: 10 },
    { name: "Base", url: "https://mainnet.base.org", expected: 8453 },
    { name: "Linea", url: "https://rpc.linea.build", expected: 59144 },
    { name: "Blast", url: "https://rpc.blast.io", expected: 81457 },
    { name: "zkSync Era", url: "https://mainnet.era.zksync.io", expected: 324 },
    { name: "Mantle", url: "https://rpc.mantle.xyz", expected: 5000 },
    { name: "Gnosis", url: "https://rpc.gnosischain.com", expected: 100 },
    { name: "Cronos", url: "https://evm.cronos.org", expected: 25 },
    { name: "Sonic", url: "https://rpc.soniclabs.com", expected: 146 },
    { name: "Berachain", url: "https://rpc.berachain.com", expected: 80094 },
    { name: "Sei", url: "https://evm-rpc.sei-apis.com", expected: 1329 },
    { name: "Neon", url: "https://neon-proxy-mainnet.solana.p2p.org", expected: 245022934 },
    { name: "Flow", url: "https://mainnet.evm.nodes.onflow.org", expected: 747 },
    { name: "Story", url: "https://mainnet.storyrpc.io", expected: 1514 },
    { name: "Abstract", url: "https://api.mainnet.abs.xyz", expected: 2741 },
    { name: "BOB", url: "https://rpc.gobob.xyz", expected: 60808 },
    { name: "HyperEVM", url: "https://rpc.hyperliquid.xyz/evm", expected: 999 },
    { name: "Sophon", url: "https://rpc.sophon.xyz", expected: 50104 },
    { name: "Tron", url: "https://api.trongrid.io/jsonrpc", expected: 728126428 },
    { name: "Injective", url: "https://evm.injective.network", expected: 1776 },
    { name: "Zilliqa", url: "https://api.zilliqa.com", expected: 32769 },
    { name: "Plasma", url: "https://rpc.plasma.build", expected: 9745 },
    { name: "Monad", url: "https://rpc.monad.xyz", expected: 143 },
    { name: "MegaETH", url: "https://rpc.megaeth.com", expected: 4326 },
];

async function testRpc(chain) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const resp = await fetch(chain.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!resp.ok) {
            return { ...chain, status: "HTTP_ERR", code: resp.status, actual: null };
        }

        const data = await resp.json();
        const actualChainId = parseInt(data.result, 16);
        const match = actualChainId === chain.expected;

        return { ...chain, status: match ? "OK" : "MISMATCH", actual: actualChainId };
    } catch (err) {
        clearTimeout(timeout);
        return { ...chain, status: "FAIL", actual: null, error: err.message };
    }
}

async function main() {
    console.log("");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("  RPC SANITY CHECK — All 30 EVM Chains");
    console.log("  " + new Date().toISOString());
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("");

    // Run all in parallel for speed
    const results = await Promise.all(chains.map(testRpc));

    let ok = 0, fail = 0, mismatch = 0;

    for (const r of results) {
        if (r.status === "OK") {
            ok++;
            console.log(`  ✅ ${r.name.padEnd(14)} chainId ${String(r.expected).padEnd(12)} ${r.url}`);
        } else if (r.status === "MISMATCH") {
            mismatch++;
            console.log(`  ❌ ${r.name.padEnd(14)} MISMATCH expected=${r.expected} got=${r.actual}  ${r.url}`);
        } else if (r.status === "HTTP_ERR") {
            fail++;
            console.log(`  ⚠️  ${r.name.padEnd(14)} HTTP ${r.code}  ${r.url}`);
        } else {
            fail++;
            const errShort = r.error ? r.error.substring(0, 60) : "unknown";
            console.log(`  ❌ ${r.name.padEnd(14)} ${errShort}  ${r.url}`);
        }
    }

    console.log("");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`  RESULTS: ${ok} ✅ OK  |  ${mismatch} ❌ MISMATCH  |  ${fail} ⚠️ UNREACHABLE`);
    console.log("═══════════════════════════════════════════════════════════════");

    if (fail > 0 || mismatch > 0) {
        console.log("");
        console.log("  ⚠️  Failed/mismatched chains need alternate RPCs.");
        console.log("  Check https://chainlist.org for alternatives.");
    }

    console.log("");
}

main();
