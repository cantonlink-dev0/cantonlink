# OTC Smart Contract Deployment Costs

## Total Cost Summary

| Category | Cost |
|----------|------|
| **All 31 EVM Chains** | **$101-110** |
| **Recommended 8 Chains** | **$65-70** |

---

## Full Breakdown: All 31 EVM Chains

### Tier 1 - High Gas Chains
| Chain | Gas Cost |
|-------|----------|
| Ethereum | $50 |
| **Subtotal** | **$50** |

### Tier 2 - Major L2s & Alt L1s
| Chain | Gas Cost |
|-------|----------|
| Arbitrum | $2 |
| Optimism | $3 |
| Base | $2 |
| Polygon | $1 |
| BSC | $2 |
| Avalanche | $3 |
| Linea | $2 |
| Blast | $2 |
| zkSync | $2 |
| Mantle | $2 |
| **Subtotal** | **$23** |

### Tier 3 - Emerging/New Chains
| Chain | Gas Cost |
|-------|----------|
| Fantom | $1 |
| Canto | $0.50 |
| Gnosis | $0.50 |
| Cronos | $1 |
| Sonic | $1 |
| Berachain | $2 |
| Sei | $1 |
| Neon EVM | $1 |
| Flow EVM | $2 |
| Story | $1 |
| Abstract | $2 |
| BOB | $2 |
| HyperEVM | $2 |
| Sophon | $2 |
| Tron | $1 |
| Injective | $1 |
| Zilliqa | $1 |
| Plasma | $2 |
| Monad | $2 |
| MegaETH | $2 |
| **Subtotal** | **$28-30** |

---

## Recommended Deployment Strategy

### Start with Top 8 Chains (Cost: $65-70)

**Why these chains:**
- Highest liquidity and user activity
- Cover 90%+ of DeFi volume
- Most cost-effective for ROI

| Chain | Gas Cost | Reason |
|-------|----------|--------|
| Ethereum | $50 | Required - #1 liquidity |
| Arbitrum | $2 | Top L2, huge DeFi volume |
| Base | $2 | Coinbase L2, growing fast |
| Optimism | $3 | Major L2 ecosystem |
| Polygon | $1 | Cheap, high activity |
| BSC | $2 | Large user base |
| Avalanche | $3 | Strong DeFi ecosystem |
| Fantom | $1 | Active DeFi community |
| **Total** | **$64** | |

### Add Later (Cost: $37-46)
Deploy to remaining 23 chains once you validate demand on the top 8.

---

## What You're Deploying

**Contract:** `OTCEscrow.sol` (already written, in your project)

**Location:** `C:\Users\chris\.gemini\antigravity\scratch\swap-bridge-dapp\contracts\OTCEscrow.sol`

**Features:**
- Escrow holds funds until both parties agree
- Supports any ERC20 token
- Atomic settlement (no disputes)
- Gas-efficient design

---

## Deployment Process

### One-Time Setup (5 minutes)
1. Open [Remix IDE](https://remix.ethereum.org)
2. Load your contract from the file above
3. Compile with Solidity 0.8.19+
4. Connect MetaMask wallet

### Per-Chain Deployment (2 minutes each)
1. Switch MetaMask to target chain
2. Click "Deploy" in Remix
3. Confirm transaction (pay gas)
4. Copy deployed contract address
5. Save address to config file

### Update Your App
After deploying, update contract addresses in:
`src/lib/contracts/otcEscrowAbi.ts`

---

## Important Notes

> [!WARNING]
> **Solana is NOT included** in these costs. Solana uses Rust/Anchor, not Solidity. Adding Solana OTC requires a completely different contract ($0 gas but requires Rust development).

> [!TIP]
> **Save Money:** Start with 8 chains ($64), not all 31. You can always deploy more later based on actual usage data.

> [!IMPORTANT]
> **Gas prices fluctuate.** These are estimates. Actual costs depend on network congestion at deployment time.

---

## Cost Comparison

| Strategy | Chains | Cost | Pros | Cons |
|----------|--------|------|------|------|
| **Minimal** | 5 top chains | ~$60 | Cheapest, fastest | Limited reach |
| **Recommended** | 8 major chains | ~$64 | Best ROI | Misses some users |
| **Comprehensive** | All 31 EVM | ~$105 | Maximum reach | High upfront cost |

---

## Next Steps

1. **Decide your strategy** (8 chains recommended)
2. **Fund wallet** with ~$70-110 depending on choice
3. **Deploy using Remix** (instructions above)
4. **Update app config** with contract addresses
5. **Test on one chain** before deploying to others
