// check-deploy-costs.mjs — Query LIVE gas prices on all 30 EVM chains
// Token USD prices from web search Feb 19, 2026
import https from 'https';
import http from 'http';

function rpc(url, method, params = []) {
    return new Promise((resolve) => {
        const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 });
        const mod = url.startsWith('https') ? https : http;
        const u = new URL(url);
        const opts = {
            hostname: u.hostname, port: u.port || undefined, path: u.pathname + u.search,
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
            timeout: 8000
        };
        const req = mod.request(opts, res => {
            let d = ''; res.on('data', c => d += c); res.on('end', () => {
                try { resolve(JSON.parse(d).result); } catch { resolve(null); }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        req.write(body); req.end();
    });
}

// All 30 mainnet EVM chains from hardhat.config.ts
// USD prices verified from web search — Feb 19, 2026
const chains = [
    // TIER 1: L1 Majors
    { name: 'Ethereum', url: 'https://eth.llamarpc.com', sym: 'ETH', price: 1941 },
    { name: 'BNB Chain', url: 'https://bsc-dataseed1.binance.org', sym: 'BNB', price: 607 },
    { name: 'Polygon', url: 'https://polygon-bor-rpc.publicnode.com', sym: 'POL', price: 0.11 },
    { name: 'Avalanche', url: 'https://api.avax.network/ext/bc/C/rpc', sym: 'AVAX', price: 8.89 },
    { name: 'Fantom', url: 'https://fantom.drpc.org', sym: 'FTM', price: 0.047 },
    // TIER 2: Major L2s / Rollups
    { name: 'Arbitrum', url: 'https://arb1.arbitrum.io/rpc', sym: 'ETH', price: 1941 },
    { name: 'Optimism', url: 'https://mainnet.optimism.io', sym: 'ETH', price: 1941 },
    { name: 'Base', url: 'https://mainnet.base.org', sym: 'ETH', price: 1941 },
    { name: 'Linea', url: 'https://rpc.linea.build', sym: 'ETH', price: 1941 },
    { name: 'Blast', url: 'https://rpc.blast.io', sym: 'ETH', price: 1941 },
    { name: 'zkSync', url: 'https://mainnet.era.zksync.io', sym: 'ETH', price: 1941 },
    { name: 'Mantle', url: 'https://rpc.mantle.xyz', sym: 'MNT', price: 1.1 },
    { name: 'Gnosis', url: 'https://rpc.gnosischain.com', sym: 'xDAI', price: 1 },
    { name: 'Cronos', url: 'https://evm.cronos.org', sym: 'CRO', price: 0.16 },
    // TIER 3: Next-Gen / Emerging
    { name: 'Sonic', url: 'https://rpc.soniclabs.com', sym: 'S', price: 0.60 },
    { name: 'Berachain', url: 'https://rpc.berachain.com', sym: 'BERA', price: 0.57 },
    { name: 'Sei', url: 'https://evm-rpc.sei-apis.com', sym: 'SEI', price: 0.075 },
    { name: 'Neon', url: 'https://neon-proxy-mainnet.solana.p2p.org', sym: 'NEON', price: 0.50 },
    { name: 'Flow', url: 'https://mainnet.evm.nodes.onflow.org', sym: 'FLOW', price: 0.75 },
    { name: 'Story', url: 'https://mainnet.storyrpc.io', sym: 'IP', price: 4 },
    { name: 'Abstract', url: 'https://api.mainnet.abs.xyz', sym: 'ETH', price: 1941 },
    { name: 'BOB', url: 'https://rpc.gobob.xyz', sym: 'ETH', price: 1941 },
    { name: 'HyperEVM', url: 'https://rpc.hyperliquid.xyz/evm', sym: 'HYPE', price: 28 },
    { name: 'Sophon', url: 'https://rpc.sophon.xyz', sym: 'SOPH', price: 1 },
    { name: 'Tron', url: 'https://api.trongrid.io/jsonrpc', sym: 'TRX', price: 0.25 },
    { name: 'Injective', url: 'https://sentry.evm-rpc.injective.network', sym: 'INJ', price: 3.20 },
    { name: 'Zilliqa', url: 'https://api.zilliqa.com', sym: 'ZIL', price: 0.025 },
    { name: 'Plasma', url: 'https://rpc.plasma.to', sym: 'PLASMA', price: 0.01 },
    { name: 'Monad', url: 'https://monad-mainnet.drpc.org', sym: 'MON', price: 0.02 },
    { name: 'MegaETH', url: 'https://6342.rpc.thirdweb.com', sym: 'ETH', price: 1941 },
];

// ~1.5M gas for a Solidity contract deploy (optimizer on, 200 runs)
const DEPLOY_GAS = 1_500_000n;

async function main() {
    console.log('');
    console.log('='.repeat(78));
    console.log(' EVM DEPLOY COST — ALL 30 MAINNET CHAINS');
    console.log(' Gas prices: LIVE from RPC | Token prices: verified Feb 19 2026');
    console.log('='.repeat(78));
    console.log('');
    console.log('#  Chain                | Gas Price     | Native Cost       | USD');
    console.log('---|---------------------|---------------|-------------------|--------');

    let totalUSD = 0;
    let idx = 0;
    let failedChains = [];

    for (const c of chains) {
        idx++;
        const gp = await rpc(c.url, 'eth_gasPrice');
        if (gp) {
            const gpWei = BigInt(gp);
            const costWei = gpWei * DEPLOY_GAS;
            const costNative = Number(costWei) / 1e18;
            const usd = costNative * c.price;
            totalUSD += usd;
            const gpGwei = (Number(gpWei) / 1e9).toFixed(2);
            const num = String(idx).padStart(2);
            console.log(
                num + ' ' + c.name.padEnd(21) + '| ' +
                (gpGwei + ' gwei').padEnd(14) + '| ' +
                (costNative.toFixed(6) + ' ' + c.sym).padEnd(18) + '| $' + usd.toFixed(4)
            );
        } else {
            failedChains.push(c.name);
            const num = String(idx).padStart(2);
            console.log(num + ' ' + c.name.padEnd(21) + '| TIMEOUT/ERR   |                   | ???');
        }
    }

    console.log('---|---------------------|---------------|-------------------|--------');
    console.log('   TOTAL EVM (30 chains)'.padEnd(60) + '| $' + totalUSD.toFixed(2));
    console.log('');
    console.log('--- NON-EVM (for reference) ---');
    console.log('   Solana: 1.87 SOL x $81 = ~$151 (NOT included above)');
    console.log('   Sui:    ALREADY DEPLOYED (0.0166 SUI = ~$0.05)');
    console.log('');
    console.log('TOKEN PRICES USED (from web search Feb 19 2026):');
    console.log('  ETH=$1941  BNB=$607  POL=$0.11  AVAX=$8.89  FTM=$0.047');
    console.log('  INJ=$3.20  BERA=$0.57  SEI=$0.075  HYPE=$28  MON=$0.02');
    console.log('  Others: MNT=$1.10  xDAI=$1  CRO=$0.16  S=$0.60  NEON=$0.50');
    console.log('  FLOW=$0.75  IP=$4  SOPH=$1  TRX=$0.25  ZIL=$0.025  PLASMA=$0.01');

    if (failedChains.length) {
        console.log('');
        console.log('FAILED TO REACH: ' + failedChains.join(', '));
    }
}

main();
