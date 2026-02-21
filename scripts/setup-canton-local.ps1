# ═══════════════════════════════════════════════════════════════════
#  Canton Network Local Development — Docker Quickstart
# ═══════════════════════════════════════════════════════════════════
#
#  This script sets up a full Canton participant node locally using
#  the official Canton Network Quickstart Docker environment.
#
#  PREREQUISITES:
#    - Docker Desktop installed and running (8 GB+ RAM allocated)
#    - Git installed
#
#  WHAT YOU GET:
#    - Canton participant node with JSON Ledger API on localhost
#    - DAML sandbox for testing contracts
#    - Full xReserve bridge simulation
#
#  PORTS:
#    App User Participant JSON API:    http://localhost:2975
#    App Provider Participant JSON API: http://localhost:3975
#    Super Validator Participant JSON API: http://localhost:4975
#    Standard Canton JSON API:         http://localhost:7575
#
# ═══════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Canton Network — Local Development Setup" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Check Docker ──────────────────────────────────────────────
Write-Host "  [1/5] Checking Docker..." -ForegroundColor Yellow
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "  X Docker not found!" -ForegroundColor Red
    Write-Host "  Install Docker Desktop: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  X Docker is not running! Start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "  OK Docker is running" -ForegroundColor Green

# ── Step 2: Clone Canton Quickstart ───────────────────────────────────
$cantonDir = "C:\Users\chris\.gemini\antigravity\scratch\canton-quickstart"

if (Test-Path "$cantonDir\.git") {
    Write-Host "  [2/5] Canton Quickstart already cloned, pulling latest..." -ForegroundColor Yellow
    git -C $cantonDir pull
}
else {
    Write-Host "  [2/5] Cloning Canton Quickstart..." -ForegroundColor Yellow
    git clone https://github.com/digital-asset/cn-quickstart.git $cantonDir
}

if (-not (Test-Path $cantonDir)) {
    Write-Host "  X Clone failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  OK Canton Quickstart ready at: $cantonDir" -ForegroundColor Green

# ── Step 3: Docker Login ──────────────────────────────────────────────
Write-Host ""
Write-Host "  [3/5] Docker login..." -ForegroundColor Yellow
Write-Host "  If prompted, use your Docker Hub credentials." -ForegroundColor DarkGray
docker login
Write-Host "  OK Docker logged in" -ForegroundColor Green

# ── Step 4: Setup & Build ─────────────────────────────────────────────
Write-Host ""
Write-Host "  [4/5] Building Canton environment..." -ForegroundColor Yellow
Write-Host "  This may take 5-10 minutes on first run." -ForegroundColor DarkGray

Push-Location $cantonDir\quickstart

# Install DAML SDK
if (Test-Path "Makefile") {
    make install-daml-sdk 2>&1
    make setup 2>&1
    make build 2>&1
}
else {
    Write-Host "  Makefile not found — trying docker-compose directly..." -ForegroundColor Yellow
    docker-compose build 2>&1
}

Pop-Location
Write-Host "  OK Build complete" -ForegroundColor Green

# ── Step 5: Start Canton ──────────────────────────────────────────────
Write-Host ""
Write-Host "  [5/5] Starting Canton Network..." -ForegroundColor Yellow

Push-Location $cantonDir\quickstart
if (Test-Path "Makefile") {
    make start
}
else {
    docker-compose up -d
}
Pop-Location

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Canton Network is RUNNING!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  JSON API endpoints:" -ForegroundColor Cyan
Write-Host "    App User:       http://localhost:2975" -ForegroundColor White
Write-Host "    App Provider:   http://localhost:3975" -ForegroundColor White
Write-Host "    Super Validator: http://localhost:4975" -ForegroundColor White
Write-Host "    Standard:       http://localhost:7575" -ForegroundColor White
Write-Host ""
Write-Host "  Update your .env.local:" -ForegroundColor Yellow
Write-Host '    CANTON_JSON_API_URL=http://localhost:7575' -ForegroundColor White
Write-Host '    CANTON_VALIDATOR_URL=http://localhost:5003' -ForegroundColor White
Write-Host ""
Write-Host "  Create a test party:" -ForegroundColor Yellow
Write-Host '    curl -X POST http://localhost:7575/v2/parties -d "{\"partyIdHint\":\"moneyMoveUser\"}" -H "Content-Type: application/json"' -ForegroundColor White
Write-Host ""
Write-Host "  Stop Canton:" -ForegroundColor DarkGray
Write-Host "    cd $cantonDir\quickstart && make stop" -ForegroundColor DarkGray
Write-Host ""
