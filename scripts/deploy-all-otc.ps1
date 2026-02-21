# ═══════════════════════════════════════════════════════════════════
#  OTC Escrow — Deploy to ALL 21 EVM Chains
#  Verified costs from live RPC queries — Feb 19, 2026
# ═══════════════════════════════════════════════════════════════════
#
#  PREREQUISITES:
#    1. Fund deployer wallet on each chain
#    2. Set: $env:DEPLOYER_PRIVATE_KEY="0xYOUR_KEY"
#    3. Run: npm install (hardhat deps)
#
# ═══════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  OTCEscrow — Deploy to ALL 21 EVM Chains" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check deployer key
if (-not $env:DEPLOYER_PRIVATE_KEY) {
    Write-Host "  X DEPLOYER_PRIVATE_KEY not set!" -ForegroundColor Red
    Write-Host '  Run: $env:DEPLOYER_PRIVATE_KEY="0xYOUR_PRIVATE_KEY"' -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "  OK Deployer key is set" -ForegroundColor Green
Write-Host ""

# ─── Compile ────────────────────────────────────────────────────────
Write-Host "  [1/3] Compiling OTCEscrow.sol..." -ForegroundColor Yellow
npx hardhat compile
if ($LASTEXITCODE -ne 0) {
    Write-Host "  X Compilation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  OK Compiled successfully" -ForegroundColor Green
Write-Host ""

# ─── Deploy ─────────────────────────────────────────────────────────
# 21 EVM chains — costs from LIVE RPC gas queries × verified token prices

$chains = @(
    # Tier 1: L1 Majors
    @{ Name = "Ethereum"; Network = "ethereum"; ChainId = "1"; Cost = "~`$0.13" }
    @{ Name = "BNB Chain"; Network = "bsc"; ChainId = "56"; Cost = "~`$0.05" }
    @{ Name = "Polygon"; Network = "polygon"; ChainId = "137"; Cost = "~`$0.05" }
    @{ Name = "Avalanche"; Network = "avalanche"; ChainId = "43114"; Cost = "~`$0.001" }

    # Tier 2: L2s / Rollups
    @{ Name = "Arbitrum"; Network = "arbitrum"; ChainId = "42161"; Cost = "~`$0.06" }
    @{ Name = "Optimism"; Network = "optimism"; ChainId = "10"; Cost = "~`$0.003" }
    @{ Name = "Base"; Network = "base"; ChainId = "8453"; Cost = "~`$0.02" }
    @{ Name = "Linea"; Network = "linea"; ChainId = "59144"; Cost = "~`$0.12" }
    @{ Name = "Mantle"; Network = "mantle"; ChainId = "5000"; Cost = "~`$0.00" }
    @{ Name = "Cronos"; Network = "cronos"; ChainId = "25"; Cost = "~`$0.09" }

    # Tier 3: Next-Gen / Emerging
    @{ Name = "Sonic"; Network = "sonic"; ChainId = "146"; Cost = "~`$0.05" }
    @{ Name = "Berachain"; Network = "berachain"; ChainId = "80094"; Cost = "~`$0.00" }
    @{ Name = "Sei"; Network = "sei"; ChainId = "1329"; Cost = "~`$0.001" }
    @{ Name = "Flow"; Network = "flow"; ChainId = "747"; Cost = "~`$0.02" }
    @{ Name = "Story"; Network = "story"; ChainId = "1514"; Cost = "~`$0.00" }
    @{ Name = "Abstract"; Network = "abstract"; ChainId = "2741"; Cost = "~`$0.13" }
    @{ Name = "BOB"; Network = "bob"; ChainId = "60808"; Cost = "~`$0.003" }
    @{ Name = "HyperEVM"; Network = "hyperevm"; ChainId = "999"; Cost = "~`$0.004" }
    @{ Name = "Plasma"; Network = "plasma"; ChainId = "9745"; Cost = "~`$0.00" }
    @{ Name = "Monad"; Network = "monad"; ChainId = "143"; Cost = "~`$0.003" }
    @{ Name = "MegaETH"; Network = "megaeth"; ChainId = "6342"; Cost = "~`$0.003" }
)

Write-Host "  [2/3] Deploying to $($chains.Count) EVM chains..." -ForegroundColor Yellow
Write-Host ""

$deployed = @()
$failed = @()
$count = 0

foreach ($chain in $chains) {
    $count++
    Write-Host "  [$count/$($chains.Count)] $($chain.Name) (chainId $($chain.ChainId)) — est. $($chain.Cost)" -ForegroundColor Cyan

    $result = npx hardhat run scripts/deploy-otc.ts --network $chain.Network 2>&1

    if ($LASTEXITCODE -eq 0) {
        $deployed += $chain.Name
        Write-Host "    OK Deployed!" -ForegroundColor Green
    }
    else {
        $failed += $chain.Name
        Write-Host "    !! Skipped (insufficient funds or RPC error)" -ForegroundColor Yellow
        Write-Host "    $result" -ForegroundColor DarkGray
    }
    Write-Host ""
}

# ─── Summary ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  [3/3] DEPLOY SUMMARY" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($deployed.Count -gt 0) {
    Write-Host "  OK Deployed ($($deployed.Count) chains):" -ForegroundColor Green
    Write-Host "     $($deployed -join ', ')" -ForegroundColor Green
}
if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "  !! Failed ($($failed.Count) chains):" -ForegroundColor Yellow
    Write-Host "     $($failed -join ', ')" -ForegroundColor Yellow
    Write-Host "     Fund deployer wallet on those chains and re-run." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  Non-EVM (deploy separately):" -ForegroundColor DarkGray
Write-Host "    Solana: solana program deploy target/deploy/otc_escrow.so" -ForegroundColor DarkGray
Write-Host "    Sui:    ALREADY DEPLOYED" -ForegroundColor Green
Write-Host ""
Write-Host "  Addresses auto-saved to: src/lib/contracts/otcEscrowAbi.ts" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
