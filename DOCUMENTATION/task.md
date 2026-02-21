# Production Readiness — Go Live

## Phase 1: Remove Mock Infrastructure
- [x] Delete `src/lib/mock/` (3 files)
- [x] Update `.env.local` — set `MOCK_MODE=0`, add key placeholders

## Phase 2: Clean Adapters
- [x] 1inch adapter — remove mock fallback
- [x] Jupiter adapter — remove mock fallback
- [x] LI.FI adapter — remove mock fallback

## Phase 3: OTC Smart Contract
- [x] Write `contracts/OTCEscrow.sol`
- [x] Generate ABI + addresses file `src/lib/contracts/otcEscrowAbi.ts`

## Phase 4: Wire Token Explorer to Real APIs
- [x] Replace `SwapWidget.handleSwap()` simulation with real API calls

## Phase 5: OTC Real Integration
- [x] Rewrite `useOTCOrders` — real contract calls instead of setTimeout
- [x] Clean `otcStore.ts` — remove mockTxHash, remove seed orders
- [x] Clean `otcTypes.ts` — remove "Mock" comments, add onChainOrderId

## Phase 6: Verification
- [x] Build compiles clean (✓ Compiled successfully, 8/8 pages)
- [x] Test files updated (all 4 test files fixed)
- [x] Update walkthrough

## Phase 7: API Keys & Deployment
- [x] Replaced 1inch (needs key) with ParaSwap (free, no key)
- [x] WalletConnect — uses built-in fallback project ID
- [x] LI.FI — works without key (rate-limited)
- [x] `.env.local` cleaned — zero required keys
- [ ] OTC contract deployment (requires user wallet + funds)
