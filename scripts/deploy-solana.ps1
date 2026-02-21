# ═══════════════════════════════════════════════════════════════
#  Deploy Solana OTC Escrow
#  Cost: ~0.02 SOL (~$5)
# ═══════════════════════════════════════════════════════════════
#
#  PREREQUISITES:
#    1. Install Rust:  https://rustup.rs
#    2. Install Solana CLI:  sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
#    3. Install Anchor CLI:  cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli
#    4. Fund your wallet with ~0.05 SOL
#
#  WALLET SETUP:
#    - Import your key:
#      solana-keygen recover -o ~/.config/solana/id.json
#    - Or create new:
#      solana-keygen new -o ~/.config/solana/id.json
#    - Set mainnet:
#      solana config set --url https://api.mainnet-beta.solana.com
#
#  USAGE:
#    .\scripts\deploy-solana.ps1
#
# ═══════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$solanaDir = Join-Path $projectRoot "contracts\solana\otc_escrow"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  MoneyMove 2026 — SOLANA OTC DEPLOY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Pre-flight ────────────────────────────────────────────────────────

# Check Solana CLI
$solVer = solana --version 2>$null
if (-not $solVer) {
    Write-Host "  ✗ Solana CLI not found!" -ForegroundColor Red
    Write-Host "  Install: https://docs.anza.xyz/cli/install" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ $solVer" -ForegroundColor Green

# Check Anchor CLI
$anchorVer = anchor --version 2>$null
if (-not $anchorVer) {
    Write-Host "  ✗ Anchor CLI not found!" -ForegroundColor Red
    Write-Host "  Install: cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli" -ForegroundColor Yellow
    exit 1
}
Write-Host "  ✓ $anchorVer" -ForegroundColor Green

# Check cluster is mainnet
$cluster = solana config get 2>$null | Select-String "RPC URL"
Write-Host "  ℹ $cluster" -ForegroundColor DarkGray

# Check balance
$balance = solana balance 2>$null
Write-Host "  ℹ Balance: $balance" -ForegroundColor DarkGray
Write-Host ""

# ─── Build ─────────────────────────────────────────────────────────────

Write-Host "  [1] Building Solana program..." -ForegroundColor Yellow
Set-Location $solanaDir
anchor build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Built successfully" -ForegroundColor Green
Write-Host ""

# ─── Deploy ──────────────────────────────────────────────────────────

Write-Host "  [2] Deploying to Solana mainnet..." -ForegroundColor Yellow
$deployOutput = anchor deploy 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Deploy failed!" -ForegroundColor Red
    Write-Host $deployOutput -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "  Common fixes:" -ForegroundColor Yellow
    Write-Host "    - Not enough SOL: solana airdrop 0.1 (devnet only)" -ForegroundColor DarkGray
    Write-Host "    - Wrong cluster: solana config set --url https://api.mainnet-beta.solana.com" -ForegroundColor DarkGray
    exit 1
}

# Extract Program ID
$programId = ($deployOutput | Select-String "Program Id: (\w+)").Matches.Groups[1].Value
Write-Host "  ✓ Deployed!" -ForegroundColor Green
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SOLANA PROGRAM ID:" -ForegroundColor Cyan
Write-Host "  $programId" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Update frontend ─────────────────────────────────────────────────

if ($programId) {
    Write-Host "  [3] Updating frontend config..." -ForegroundColor Yellow
    
    # Update lib.rs with program ID
    $libPath = Join-Path $solanaDir "programs\otc_escrow\src\lib.rs"
    $libContent = Get-Content $libPath -Raw
    $libContent = $libContent -replace 'declare_id!\("YOUR_PROGRAM_ID_HERE"\)', "declare_id!(""$programId"")"
    Set-Content $libPath $libContent
    
    # Also update the original lib.rs
    $origLibPath = Join-Path $solanaDir "src\lib.rs"
    if (Test-Path $origLibPath) {
        $origContent = Get-Content $origLibPath -Raw
        $origContent = $origContent -replace 'declare_id!\("YOUR_PROGRAM_ID_HERE"\)', "declare_id!(""$programId"")"
        Set-Content $origLibPath $origContent
    }

    Write-Host "  ✓ Updated lib.rs with Program ID" -ForegroundColor Green
    Write-Host ""
    Write-Host "  NEXT: Add this Program ID to your frontend:" -ForegroundColor Yellow
    Write-Host "  File: src\lib\contracts\otcEscrowAbi.ts" -ForegroundColor White
    Write-Host "  Add: SOLANA_OTC_PROGRAM_ID = '$programId'" -ForegroundColor White
}

Write-Host ""
Set-Location $projectRoot
