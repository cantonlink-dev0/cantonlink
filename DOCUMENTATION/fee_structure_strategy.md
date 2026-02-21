# CantonLink Fee Structure & Monetization Strategy

## Competitor Analysis

### DEX Aggregators (Swap Platforms)

| Platform | Fee Structure | Notes |
|----------|--------------|-------|
| **Uniswap** | 0.05% - 1% | Goes to LPs, not protocol. 0.15% interface fee added in 2023 on some tokens |
| **1inch** | **0% platform fee** | Only gas fees. API users pay 0-0.3% infrastructure fee |
| **ParaSwap** | **Service fee varies** | Not publicly disclosed, likely 0.1-0.3% |
| **Jupiter (Solana)** | **0% on basic swaps** | 10 BPS (0.10%) on perps, 30 BPS (0.30%) on limit orders, 10 BPS on DCA |

### Bridge Aggregators

| Platform | Fee Structure | Notes |
|----------|--------------|-------|
| **deBridge** | **0.04%** (4 basis points) | Plus small flat fee in native gas token |
| **LI.FI** | **0.25%** | Standard service fee on all transactions |
| **Across Protocol** | **0%** | All fees go to LPs and relayers, protocol takes nothing |

---

## Key Insights

### What Makes Money

1. **Swap Aggregators**: 0-0.3% is standard, with most around **0.1-0.15%**
2. **Bridge Aggregators**: 0.04-0.25%, with **0.1-0.15%** being competitive
3. **Advanced Features**: Higher fees (0.3%+) for limit orders, perps, DCA

### Industry Standards

- **Basic Swaps**: 0-0.15%
- **Cross-chain Bridges**: 0.04-0.25%
- **Premium Features**: 0.30%+
- **API/White-label**: 0.05-0.30% extra

---

## Recommended Fee Structure for CantonLink

### Tier 1: Basic Swaps (Same-Chain)
**Fee: 0.10%** (10 basis points)

- **Why:** Competitive with 1inch (0%) but still generates revenue
- **User pays:** $1 fee on $1,000 swap
- **Reasoning:** Slightly below ParaSwap, fair for aggregation value

### Tier 2: Cross-Chain Bridges
**Fee: 0.15%** (15 basis points)

- **Why:** Between deBridge (0.04%) and LI.FI (0.25%)
- **User pays:** $1.50 fee on $1,000 bridge
- **Reasoning:** More complex than swaps, justifies higher fee

### Tier 3: OTC P2P Trading
**Fee: 0.25%** (25 basis points) **per side**

- **Why:** Premium service, escrow + matching
- **User pays:** $2.50 each (maker + taker) on $1,000 trade
- **Total revenue:** $5 per $1,000 trade
- **Reasoning:** Higher touch service, more infrastructure cost

### Tier 4: Advanced Features (Future)
- **Limit Orders**: 0.30% (30 BPS)
- **DCA**: 0.20% (20 BPS) per execution
- **Stop Loss**: 0.30% (30 BPS)

---

## Revenue Projections

### Conservative Estimate ($1M daily volume)

| Product | Daily Volume | Fee % | Daily Revenue | Monthly Revenue |
|---------|--------------|-------|---------------|-----------------|
| Basic Swaps | $500,000 | 0.10% | $500 | $15,000 |
| Bridges | $400,000 | 0.15% | $600 | $18,000 |
| OTC Trading | $100,000 | 0.50% | $500 | $15,000 |
| **TOTAL** | **$1,000,000** | - | **$1,600** | **$48,000/mo** |

### Moderate Estimate ($10M daily volume)

| Product | Daily Volume | Fee % | Daily Revenue | Monthly Revenue |
|---------|--------------|-------|---------------|-----------------|
| Basic Swaps | $5,000,000 | 0.10% | $5,000 | $150,000 |
| Bridges | $4,000,000 | 0.15% | $6,000 | $180,000 |
| OTC Trading | $1,000,000 | 0.50% | $5,000 | $150,000 |
| **TOTAL** | **$10,000,000** | - | **$16,000** | **$480,000/mo** |

### Aggressive Estimate ($50M daily volume)

| Product | Daily Volume | Fee % | Daily Revenue | Monthly Revenue |
|---------|--------------|-------|---------------|-----------------|
| Basic Swaps | $25,000,000 | 0.10% | $25,000 | $750,000 |
| Bridges | $20,000,000 | 0.15% | $30,000 | $900,000 |
| OTC Trading | $5,000,000 | 0.50% | $25,000 | $750,000 |
| **TOTAL** | **$50,000,000** | - | **$80,000** | **$2,400,000/mo** |

---

## Implementation Strategy

### Phase 1: Launch (Months 1-3)
- **Fee: 0% on all products** (free to use)
- **Goal:** User acquisition, build volume and liquidity
- **Cost:** Absorb aggregator platform fees (if any)

### Phase 2: Soft Monetization (Months 4-6)
- **Swap Fee: 0.05%** (half rate)
- **Bridge Fee: 0.10%** (below target rate)
- **OTC Fee: 0.15%** (per side)
- **Goal:** Test user price sensitivity, maintain growth

### Phase 3: Full Monetization (Months 7+)
- **Swap Fee: 0.10%** (target rate)
- **Bridge Fee: 0.15%** (target rate)
- **OTC Fee: 0.25%** (per side)
- **Goal:** Full revenue generation

---

## Fee Distribution Options

### Option A: Pure Revenue
- **100%** of fees go to treasury
- **Pro:** Max revenue
- **Con:** Less user loyalty

### Option B: Token Holder Revenue Share
- **50%** to treasury, **50%** to token holders/stakers
- **Pro:** Creates utility token
- **Con:** Need to launch token

### Option C: Hybrid Model (Recommended)
- **60%** to treasury (operations)
- **30%** to liquidity providers/OTC makers
- **10%** to token buyback/burn fund
- **Pro:** Balances all stakeholders
- **Con:** More complex

---

## Competitive Positioning

### Compared to Competitors

| Platform | Swap Fee | Bridge Fee | Advantage |
|----------|----------|------------|-----------|
| **1inch** | 0% | N/A | Cheaper than us |
| **ParaSwap** | ~0.10% | N/A | Same as us |
| **Uniswap** | 0.05-1% | N/A | We're cheaper |
| **deBridge** | N/A | 0.04% | Cheaper than us |
| **LI.FI** | N/A | 0.25% | **We're cheaper** |
| **CantonLink** | **0.10%** | **0.15%** | **Middle ground** |

---

## Next Steps

1. **Code Implementation:** Add fee % to swap/bridge/OTC quote calculations
2. **UI Updates:** Show fee breakdown in transaction preview
3. **Analytics:** Track fee revenue by product/chain
4. **Transparency:** Create public fee schedule page
5. **A/B Testing:** Test different fee rates with user segments

---

## Fee Collection Technical Implementation

```typescript
// Example: Add fee to swap quote
function calculateSwapFee(amount: number, feePercent: number): number {
  return amount * (feePercent / 100);
}

const swapAmount = 1000; // USDC
const feePercent = 0.10; // 0.10%
const fee = calculateSwapFee(swapAmount, feePercent); // $1.00
const userReceives = swapAmount - fee; // $999.00

// Fee wallet address (multi-sig recommended)
const FEE_WALLET = "0x..."; // Your treasury address
```

**Where Fees Are Charged:**
- Deducted from **source token** before swap/bridge
- Sent directly to treasury wallet
- Transparent in transaction preview
- Shown in receipt/confirmation

---

## Summary

**Recommended Fee Structure:**
- **Swaps: 0.10%**
- **Bridges: 0.15%**
- **OTC: 0.25% per side**

**Expected Revenue at $10M Daily Volume:**
- **~$480,000/month** ($5.76M/year)

**Competitive Position:**
- Below LI.FI (0.25%) on bridges
- Same as ParaSwap (~0.10%) on swaps
- Above 1inch (0%) but justified by multi-chain + OTC features

**Launch Strategy:**
- Start at 0% (3 months free)
- Ramp to 50% of target (3 months)
- Full fees at month 7+
