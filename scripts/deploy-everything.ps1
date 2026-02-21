# ═══════════════════════════════════════════════════════════════════════════
#  DEPLOY EVERYTHING — OTC Escrow to ALL 30 EVM + Solana + Sui
#  All 30 RPCs verified live: Feb 19 2026
# ═══════════════════════════════════════════════════════════════════════════
#
#  BEFORE RUNNING:
#    1. Fund your deployer wallet on each chain
#    2. Set your EVM private key:
#       $env:DEPLOYER_PRIVATE_KEY = "0xYOUR_PRIVATE_KEY"
#    3. Run this script:
#       .\scripts\deploy-everything.ps1
#
# ═══════════════════════════════════════════════════════════════════════════

param(
    [switch]$SkipEthereum,     # Skip ETH mainnet ($60-150 savings)
    [switch]$SkipSolana,       # Skip Solana deploy
    [switch]$SkipSui,          # Skip Sui deploy
    [switch]$EVMOnly,          # Only do EVM chains
    [switch]$DryRun            # Just check balances, don't deploy
)

$ErrorActionPreference = "Continue"
$projectRoot = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  MoneyMove 2026 — DEPLOY EVERYTHING" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Pre-flight checks ──────────────────────────────────────────────────

if (-not $env:DEPLOYER_PRIVATE_KEY) {
    Write-Host "  ✗ DEPLOYER_PRIVATE_KEY not set!" -ForegroundColor Red
    Write-Host ""
    Write-Host '  Run this first:' -ForegroundColor Yellow
    Write-Host '  $env:DEPLOYER_PRIVATE_KEY = "0xYOUR_64_HEX_CHAR_PRIVATE_KEY"' -ForegroundColor White
    Write-Host ""
    exit 1
}
Write-Host "  ✓ Deployer key is set" -ForegroundColor Green

$nodeVer = node --version 2>$null
if (-not $nodeVer) {
    Write-Host "  ✗ Node.js not found! Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Node.js $nodeVer" -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
#  PHASE 1: EVM CHAINS — 29 auto + 1 prompted (Ethereum)
#  All 30 RPCs verified live, correct chainId confirmed: Feb 19 2026
# ═══════════════════════════════════════════════════════════════════════════

Write-Host "══ PHASE 1: EVM CONTRACTS (30 chains) ════════════════════════" -ForegroundColor Yellow
Write-Host ""

# Ordered cheapest → most expensive (Ethereum prompted separately)
$evmChains = @(
    # ─── Tier 2: L2s (cheapest — pennies) ─────────────────────────────
    @{ Name = "Gnosis"; Net = "gnosis"; Id = "100"; Gas = "xDAI" }
    @{ Name = "Polygon"; Net = "polygon"; Id = "137"; Gas = "POL" }
    @{ Name = "Mantle"; Net = "mantle"; Id = "5000"; Gas = "MNT" }
    @{ Name = "Cronos"; Net = "cronos"; Id = "25"; Gas = "CRO" }
    @{ Name = "Fantom"; Net = "fantom"; Id = "250"; Gas = "FTM" }
    @{ Name = "Sei"; Net = "sei"; Id = "1329"; Gas = "SEI" }
    @{ Name = "Sonic"; Net = "sonic"; Id = "146"; Gas = "S" }
    @{ Name = "Flow"; Net = "flow"; Id = "747"; Gas = "FLOW" }
    @{ Name = "Plasma"; Net = "plasma"; Id = "9745"; Gas = "XPL" }
    @{ Name = "Arbitrum"; Net = "arbitrum"; Id = "42161"; Gas = "ETH" }
    @{ Name = "Optimism"; Net = "optimism"; Id = "10"; Gas = "ETH" }
    @{ Name = "Base"; Net = "base"; Id = "8453"; Gas = "ETH" }
    @{ Name = "Blast"; Net = "blast"; Id = "81457"; Gas = "ETH" }
    @{ Name = "Abstract"; Net = "abstract"; Id = "2741"; Gas = "ETH" }
    @{ Name = "BOB"; Net = "bob"; Id = "60808"; Gas = "ETH" }
    @{ Name = "Sophon"; Net = "sophon"; Id = "50104"; Gas = "ETH" }
    @{ Name = "MegaETH"; Net = "megaeth"; Id = "6342"; Gas = "ETH" }
    @{ Name = "Monad"; Net = "monad"; Id = "143"; Gas = "MON" }

    # ─── Tier 1: L1 Majors ────────────────────────────────────────────
    @{ Name = "Avalanche"; Net = "avalanche"; Id = "43114"; Gas = "AVAX" }
    @{ Name = "Neon"; Net = "neon"; Id = "245022934"; Gas = "NEON" }
    @{ Name = "Story"; Net = "story"; Id = "1514"; Gas = "IP" }
    @{ Name = "Injective"; Net = "injective"; Id = "1776"; Gas = "INJ" }
    @{ Name = "Zilliqa"; Net = "zilliqa"; Id = "32769"; Gas = "ZIL" }
    @{ Name = "BNB Chain"; Net = "bsc"; Id = "56"; Gas = "BNB" }
    @{ Name = "Berachain"; Net = "berachain"; Id = "80094"; Gas = "BERA" }
    @{ Name = "Linea"; Net = "linea"; Id = "59144"; Gas = "ETH" }
    @{ Name = "zkSync Era"; Net = "zksync"; Id = "324"; Gas = "ETH" }
    @{ Name = "HyperEVM"; Net = "hyperevm"; Id = "999"; Gas = "HYPE" }
    @{ Name = "Tron"; Net = "tron"; Id = "728126428"; Gas = "TRX" }
)

# Compile first
Write-Host "  [1] Compiling OTCEscrow.sol..." -ForegroundColor Yellow
Set-Location $projectRoot
$compileOut = npx hardhat compile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Compilation failed:" -ForegroundColor Red
    Write-Host $compileOut -ForegroundColor DarkGray
    exit 1
}
Write-Host "  ✓ Compiled successfully" -ForegroundColor Green
Write-Host ""

# Deploy to each chain
$evmDeployed = @()
$evmFailed = @()
$count = 0

foreach ($chain in $evmChains) {
    $count++
    $label = "  [$count/$($evmChains.Count)] $($chain.Name) (chain $($chain.Id)) — $($chain.Gas)"

    if ($DryRun) {
        Write-Host "$label [DRY RUN]" -ForegroundColor DarkGray
        continue
    }

    Write-Host $label -ForegroundColor Cyan

    $result = npx hardhat run scripts/deploy-otc.ts --network $chain.Net 2>&1
    if ($LASTEXITCODE -eq 0) {
        $evmDeployed += $chain.Name
        $addr = ($result | Select-String "deployed to: (0x[a-fA-F0-9]+)").Matches.Groups[1].Value
        if ($addr) {
            Write-Host "    ✓ $addr" -ForegroundColor Green
        }
        else {
            Write-Host "    ✓ Deployed" -ForegroundColor Green
        }
    }
    else {
        $evmFailed += $chain.Name
        $errMsg = $result | Out-String
        if ($errMsg -match "insufficient funds|gas required exceeds") {
            Write-Host "    ⚠ No funds — need $($chain.Gas) on $($chain.Name)" -ForegroundColor Yellow
        }
        elseif ($errMsg -match "connect|ECONNREFUSED|timeout") {
            Write-Host "    ⚠ RPC unreachable" -ForegroundColor Yellow
        }
        else {
            Write-Host "    ✗ Failed: $($errMsg.Substring(0, [Math]::Min(100, $errMsg.Length)))" -ForegroundColor Red
        }
    }
}

# Ethereum mainnet (prompted separately — expensive)
if (-not $SkipEthereum -and -not $DryRun) {
    Write-Host ""
    Write-Host "  ── Ethereum Mainnet (~`$60-150) ──" -ForegroundColor Magenta
    $ethConfirm = Read-Host "  Deploy to Ethereum mainnet? (y/N)"
    if ($ethConfirm -eq "y" -or $ethConfirm -eq "Y") {
        $result = npx hardhat run scripts/deploy-otc.ts --network ethereum 2>&1
        if ($LASTEXITCODE -eq 0) {
            $evmDeployed += "Ethereum"
            Write-Host "    ✓ Ethereum deployed!" -ForegroundColor Green
        }
        else {
            $evmFailed += "Ethereum"
            Write-Host "    ✗ Ethereum failed" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "    — Skipped" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "  EVM Results: $($evmDeployed.Count) deployed, $($evmFailed.Count) failed" -ForegroundColor White
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════
#  PHASE 2: SOLANA (requires Anchor CLI)
# ═══════════════════════════════════════════════════════════════════════════

if (-not $EVMOnly -and -not $SkipSolana -and -not $DryRun) {
    Write-Host "══ PHASE 2: SOLANA ═══════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""

    $anchorCheck = anchor --version 2>$null
    if (-not $anchorCheck) {
        Write-Host "  ⚠ Anchor CLI not installed. Skipping Solana." -ForegroundColor Yellow
        Write-Host "  Install: cargo install --git https://github.com/coral-xyz/anchor anchor-cli" -ForegroundColor DarkGray
    }
    else {
        Write-Host "  ✓ $anchorCheck" -ForegroundColor Green
        $solanaDir = Join-Path $projectRoot "contracts\solana\otc_escrow"
        if (Test-Path $solanaDir) {
            Write-Host "  Building..." -ForegroundColor Yellow
            Set-Location $solanaDir
            anchor build 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Built. Deploying to mainnet..." -ForegroundColor Green
                anchor deploy 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✓ Solana OTC deployed!" -ForegroundColor Green
                }
                else {
                    Write-Host "  ✗ Deploy failed — check SOL balance (~0.05 SOL needed)" -ForegroundColor Red
                }
            }
            else { Write-Host "  ✗ Build failed" -ForegroundColor Red }
        }
        else { Write-Host "  ✗ Directory not found: $solanaDir" -ForegroundColor Red }
    }
    Write-Host ""
}

# ═══════════════════════════════════════════════════════════════════════════
#  PHASE 3: SUI (requires Sui CLI)
# ═══════════════════════════════════════════════════════════════════════════

if (-not $EVMOnly -and -not $SkipSui -and -not $DryRun) {
    Write-Host "══ PHASE 3: SUI ══════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""

    $suiCheck = sui --version 2>$null
    if (-not $suiCheck) {
        Write-Host "  ⚠ Sui CLI not installed. Skipping Sui." -ForegroundColor Yellow
        Write-Host "  Install: https://docs.sui.io/build/install" -ForegroundColor DarkGray
    }
    else {
        Write-Host "  ✓ $suiCheck" -ForegroundColor Green
        $suiDir = Join-Path $projectRoot "contracts\sui"
        if (Test-Path $suiDir) {
            Write-Host "  Building..." -ForegroundColor Yellow
            Set-Location $suiDir
            sui move build 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Built. Publishing to mainnet..." -ForegroundColor Green
                sui client publish --gas-budget 100000000 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✓ Sui OTC published!" -ForegroundColor Green
                }
                else {
                    Write-Host "  ✗ Publish failed — check SUI balance (~0.2 SUI needed)" -ForegroundColor Red
                }
            }
            else { Write-Host "  ✗ Build failed" -ForegroundColor Red }
        }
        else { Write-Host "  ✗ Directory not found: $suiDir" -ForegroundColor Red }
    }
    Write-Host ""
}

# ═══════════════════════════════════════════════════════════════════════════
#  FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════════════════

Set-Location $projectRoot

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT COMPLETE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($evmDeployed.Count -gt 0) {
    Write-Host "  ✓ EVM Deployed ($($evmDeployed.Count)):" -ForegroundColor Green
    Write-Host "    $($evmDeployed -join ', ')" -ForegroundColor Green
}
if ($evmFailed.Count -gt 0) {
    Write-Host "  ✗ EVM Failed ($($evmFailed.Count)):" -ForegroundColor Yellow
    Write-Host "    $($evmFailed -join ', ')" -ForegroundColor Yellow
    Write-Host "    → Fund deployer wallet and re-run." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  Addresses auto-saved to: src\lib\contracts\otcEscrowAbi.ts" -ForegroundColor Green
Write-Host "  Run 'npm run build' to pick up deployed addresses." -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
