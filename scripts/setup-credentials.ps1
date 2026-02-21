#!/usr/bin/env pwsh
# =========================================================================
# CantonLink — Credential Setup Script
# Run this: pwsh scripts/setup-credentials.ps1
# =========================================================================
#
# Opens the required sign-up pages + Canton sandbox in the right order,
# then writes the credentials you paste into .env.local automatically.
#
# WHAT YOU NEED (takes ~10 minutes total):
#  1. WalletConnect Project ID — free, instant
#  2. Canton JSON API URL (choose one option below)
# =========================================================================

$envFile = Join-Path $PSScriptRoot ".." ".env.local"
$envContent = Get-Content $envFile -Raw

function Update-EnvVar {
    param($key, $value)
    if ($envContent -match "(?m)^$key=.*$") {
        $script:envContent = $envContent -replace "(?m)^$key=.*$", "$key=$value"
    }
    else {
        $script:envContent += "`n$key=$value"
    }
    Write-Host "  ✓ Set $key" -ForegroundColor Green
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          CantonLink  Credential Setup                        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── STEP 1: WalletConnect ───────────────────────────────────────────────────
Write-Host "STEP 1: WalletConnect Project ID" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────"
Write-Host "  The app shows a 403 warning from Reown because it's using a"
Write-Host "  shared wagmi demo key. Get your own free key in 2 minutes:"
Write-Host ""
Write-Host "  1. Opening browser to https://cloud.walletconnect.com ..."
Start-Process "https://cloud.walletconnect.com"
Write-Host "  2. Sign up with GitHub (free, instant)"
Write-Host "  3. Click 'Create Project' → name it 'CantonLink' → type 'App'"
Write-Host "  4. Copy the Project ID (looks like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)"
Write-Host ""
$wcId = Read-Host "  Paste your WalletConnect Project ID here (press Enter to skip)"

if ($wcId.Trim() -ne "") {
    Update-EnvVar "NEXT_PUBLIC_WC_PROJECT_ID" $wcId.Trim()
}
else {
    Write-Host "  ⚠ Skipped — app will still work but shows a 403 warning" -ForegroundColor DarkYellow
}

# ─── STEP 2: Canton JSON API ─────────────────────────────────────────────────
Write-Host ""
Write-Host "STEP 2: Canton Ledger API URL" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────────"
Write-Host "  Canton's DAML Ledger API is NOT available as a free public URL."
Write-Host "  Choose one option:"
Write-Host ""
Write-Host "  OPTION A — DAML Hub (easiest, free tier):"
Write-Host "    1. Opening https://hub.daml.com ..."
Start-Process "https://hub.daml.com"
Write-Host "    2. Sign up / sign in"
Write-Host "    3. Create a new ledger"
Write-Host "    4. Your JSON API URL will be: https://<ledger-id>.daml.app/v1"
Write-Host "    5. Your Validator URL will be: https://<ledger-id>.daml.app/api/validator"
Write-Host ""
Write-Host "  OPTION B — Run locally (requires Docker):"
Write-Host "    docker run -it --rm -p 7575:7575 digitalasset/canton-open-source:latest"
Write-Host "    Then use: http://localhost:7575 (JSON API) + http://localhost:5003 (Validator)"
Write-Host ""
Write-Host "  OPTION C — Skip (bridge quote flow still works, ledger actions disabled)"
Write-Host ""

$cantonChoice = Read-Host "  Enter A, B, or C"

if ($cantonChoice -ieq "A") {
    $cantonJsonUrl = Read-Host "  Paste your CANTON_JSON_API_URL (e.g. https://xxx.daml.app/v1)"
    $cantonValidatorUrl = Read-Host "  Paste your CANTON_VALIDATOR_URL (e.g. https://xxx.daml.app/api/validator)"
    
    if ($cantonJsonUrl.Trim() -ne "") { Update-EnvVar "CANTON_JSON_API_URL" $cantonJsonUrl.Trim() }
    if ($cantonValidatorUrl.Trim() -ne "") { Update-EnvVar "CANTON_VALIDATOR_URL" $cantonValidatorUrl.Trim() }

}
elseif ($cantonChoice -ieq "B") {
    Update-EnvVar "CANTON_JSON_API_URL" "http://localhost:7575"
    Update-EnvVar "CANTON_VALIDATOR_URL" "http://localhost:5003"
    Write-Host "  Set to localhost. Make sure your Canton Docker container is running!" -ForegroundColor DarkYellow

}
else {
    Write-Host "  ⚠ Skipped — Canton ledger features (holdings, mint, burn) will return 503" -ForegroundColor DarkYellow
    Write-Host "  ✓ Most things still work: bridge quotes, EVM swaps, OTC" -ForegroundColor Green
}

# ─── Save .env.local ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Saving .env.local..." -ForegroundColor Cyan
Set-Content -Path $envFile -Value $envContent -NoNewline
Write-Host "✓ Saved!" -ForegroundColor Green

# ─── Restart dev server? ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────"
Write-Host "Done! Changes require a dev server restart to take effect."
Write-Host "Run: .\scripts\start-dev.ps1"
Write-Host ""
