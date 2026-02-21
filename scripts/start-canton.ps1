#!/usr/bin/env pwsh
# ================================================================
# Start Canton sandbox + JSON API proxy for CantonLink dev
# Run: pwsh scripts\start-canton.ps1
# ================================================================

$docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$nodedir = "C:\Users\chris\.gemini\antigravity\scratch\.nodejs\node-v22.14.0-win-x64"
$node = "$nodedir\node.exe"
$proxyDir = "C:\Users\chris\.gemini\antigravity\scratch\canton-proxy"

Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  CantonLink — Starting Canton Local Stack    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan

# 1. Start Docker Desktop if not running
$dockerInfo = & $docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Start-Sleep 20
    for ($i = 0; $i -lt 12; $i++) {
        & $docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { Write-Host "  ✓ Docker ready"; break }
        Write-Host "  Waiting ($i/12)..."
        Start-Sleep 5
    }
}

# 2. Start Canton container if not running
$cantRunning = & $docker ps --filter "name=canton-sandbox" --filter "status=running" -q
if (-not $cantRunning) {
    Write-Host "Starting Canton sandbox..." -ForegroundColor Yellow
    & $docker run -d `
        --name canton-sandbox `
        --restart unless-stopped `
        -p 5011:5011 -p 5012:5012 `
        -p 5018:5018 -p 5019:5019 `
        -p 5021:5021 -p 5022:5022 `
        digitalasset/canton-open-source:latest `
        daemon --no-tty --auto-connect-local -c /canton/simple-topology.conf | Out-Null
    Write-Host "  Waiting 40s for Canton JVM..." -ForegroundColor DarkGray
    Start-Sleep 40
    Write-Host "  ✓ Canton sandbox started" -ForegroundColor Green
}
else {
    Write-Host "  ✓ Canton sandbox already running" -ForegroundColor Green
}

# 3. Start JSON API proxy if not on port 7575
$pid7575 = (Get-NetTCPConnection -LocalPort 7575 -State Listen -ErrorAction SilentlyContinue).OwningProcess
if (-not $pid7575) {
    Write-Host "Starting Canton JSON API proxy (port 7575)..." -ForegroundColor Yellow
    Start-Process "cmd.exe" -ArgumentList "/c set CANTON_GRPC_HOST=127.0.0.1:5011& set PORT=7575& `"$node`" `"$proxyDir\server.js`" > `"$proxyDir\proxy.log`" 2>&1" -WindowStyle Hidden
    Start-Sleep 4
    Write-Host "  ✓ Proxy started" -ForegroundColor Green
}
else {
    Write-Host "  ✓ Canton JSON API proxy already running (PID $pid7575)" -ForegroundColor Green
}

# 4. Verify
Write-Host ""
Write-Host "Stack status:" -ForegroundColor Cyan
try {
    $h = Invoke-WebRequest "http://localhost:7575/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  Canton JSON API proxy : HTTP $($h.StatusCode) ✓" -ForegroundColor Green
}
catch {
    Write-Host "  Canton JSON API proxy : FAIL ✗" -ForegroundColor Red
}
try {
    $u = Invoke-WebRequest "http://localhost:7575/v1/user" -UseBasicParsing -TimeoutSec 5
    Write-Host "  /v1/user              : HTTP $($u.StatusCode) ✓" -ForegroundColor Green
}
catch {
    Write-Host "  /v1/user              : FAIL ✗" -ForegroundColor Red
}

Write-Host ""
Write-Host "Now start the app: npm run dev" -ForegroundColor White
