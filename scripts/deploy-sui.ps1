# ═══════════════════════════════════════════════════════════════
#  Deploy Sui OTC Escrow
#  Cost: ~0.1 SUI (~$0.50)
# ═══════════════════════════════════════════════════════════════
#
#  PREREQUISITES:
#    1. Install Sui CLI:  https://docs.sui.io/build/install
#    2. Fund your wallet with ~0.2 SUI
#
#  WALLET SETUP:
#    - Import your key:
#      sui keytool import <YOUR_PRIVATE_KEY> ed25519
#    - Or create new:
#      sui client new-address ed25519
#    - Set mainnet:
#      sui client switch --env mainnet
#    - Or add mainnet:
#      sui client new-env --alias mainnet --rpc https://fullnode.mainnet.sui.io:443
#
#  USAGE:
#    .\scripts\deploy-sui.ps1
#
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$suiDir = Join-Path $projectRoot "contracts\sui"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  MoneyMove 2026 — SUI OTC DEPLOY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Pre-flight ────────────────────────────────────────────────────────

# Check Sui CLI
$suiVer = sui --version 2>$null
if (-not $suiVer) {
    Write-Host "  ✗ Sui CLI not found!" -ForegroundColor Red
    Write-Host "  Install: https://docs.sui.io/build/install" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ $suiVer" -ForegroundColor Green

# Check active env
$envInfo = sui client active-env 2>$null
Write-Host "  ℹ Active env: $envInfo" -ForegroundColor DarkGray

# Check address
$addr = sui client active-address 2>$null
Write-Host "  ℹ Active address: $addr" -ForegroundColor DarkGray

# Check balance
$bal = sui client gas 2>$null
Write-Host "  ℹ Gas objects:" -ForegroundColor DarkGray
Write-Host $bal -ForegroundColor DarkGray
Write-Host ""

# ─── Build ─────────────────────────────────────────────────────────────

Write-Host "  [1] Building Move package..." -ForegroundColor Yellow
Set-Location $suiDir
$buildOutput = sui move build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build failed!" -ForegroundColor Red
    Write-Host $buildOutput -ForegroundColor DarkGray
    exit 1
}
Write-Host "  ✓ Built successfully" -ForegroundColor Green
Write-Host ""

# ─── Publish ────────────────────────────────────────────────────────

Write-Host "  [2] Publishing to Sui mainnet..." -ForegroundColor Yellow
$publishOutput = sui client publish --gas-budget 100000000 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Publish failed!" -ForegroundColor Red
    Write-Host $publishOutput -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Common fixes:" -ForegroundColor Yellow
    Write-Host "    - Not enough SUI: Fund your address with ~0.2 SUI" -ForegroundColor DarkGray
    Write-Host "    - Wrong env: sui client switch --env mainnet" -ForegroundColor DarkGray
    exit 1
}

# Extract Package ID
$packageId = ($publishOutput | Select-String "packageId.*?(0x[a-fA-F0-9]+)").Matches.Groups[1].Value
if (-not $packageId) {
    # Try alternate format
    $packageId = ($publishOutput | Select-String "(0x[a-fA-F0-9]{64})").Matches.Groups[1].Value
}

Write-Host "  ✓ Published!" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SUI PACKAGE ID:" -ForegroundColor Cyan
if ($packageId) {
    Write-Host "  $packageId" -ForegroundColor Green
}
else {
    Write-Host "  (Check output above for Package ID)" -ForegroundColor Yellow
}
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($packageId) {
    Write-Host "  NEXT: Add this Package ID to your frontend:" -ForegroundColor Yellow
    Write-Host "  File: src\lib\contracts\otcEscrowAbi.ts" -ForegroundColor White
    Write-Host "  Add: SUI_OTC_PACKAGE_ID = '$packageId'" -ForegroundColor White
}

Write-Host ""
Write-Host "  Full publish output:" -ForegroundColor DarkGray
Write-Host $publishOutput -ForegroundColor DarkGray
Write-Host ""
Set-Location $projectRoot
