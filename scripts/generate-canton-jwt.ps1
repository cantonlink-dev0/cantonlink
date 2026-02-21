# generate-canton-jwt.ps1
# ─────────────────────────────────────────────────────────────────────
# Generates a self-signed HMAC-SHA256 JWT for Canton ledger API access.
# This is the quickest way to get a working CANTON_JWT for development.
#
# Usage:
#   .\generate-canton-jwt.ps1 -PartyId "alice::1220abc123..." -Secret "my-dev-secret"
#
# Then paste the output into .env.local:
#   CANTON_JWT=<output>
#
# How Canton validates this:
#   - The JWT is verified against the HMAC secret in your participant node config
#   - The "sub" claim maps to your DAML party ID
#   - "aud" must match your node's configured audience (default: "https://daml.com/ledger-api")
#
# For PRODUCTION: use OIDC / OAuth2 from your identity provider instead.
# ─────────────────────────────────────────────────────────────────────

param(
    [Parameter(Mandatory = $false)]
    [string]$PartyId = "user::1220placeholder",

    [Parameter(Mandatory = $false)]
    [string]$Secret = "canton-dev-secret-change-me-in-prod",

    [Parameter(Mandatory = $false)]
    [string]$Audience = "https://daml.com/ledger-api",

    [Parameter(Mandatory = $false)]
    [int]$ExpiresInHours = 720   # 30 days for dev
)

function ConvertTo-Base64UrlEncoding([byte[]]$bytes) {
    [Convert]::ToBase64String($bytes) -replace '\+', '-' -replace '/', '_' -replace '=', ''
}

# Header
$header = [System.Text.Encoding]::UTF8.GetBytes(
    '{"alg":"HS256","typ":"JWT"}'
)
$headerEncoded = ConvertTo-Base64UrlEncoding $header

# Payload
$now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$exp = $now + ($ExpiresInHours * 3600)

$payloadObj = @{
    sub                           = $PartyId
    aud                           = $Audience
    iat                           = $now
    exp                           = $exp
    # DAML-specific claims
    "https://daml.com/ledger-api" = @{
        ledgerId      = "canton-mainnet"
        applicationId = "money-move-2026"
        actAs         = @($PartyId)
        readAs        = @($PartyId)
    }
}

$payloadJson = $payloadObj | ConvertTo-Json -Compress -Depth 5
$payloadBytes = [System.Text.Encoding]::UTF8.GetBytes($payloadJson)
$payloadEncoded = ConvertTo-Base64UrlEncoding $payloadBytes

# Signing input
$signingInput = "$headerEncoded.$payloadEncoded"
$signingBytes = [System.Text.Encoding]::UTF8.GetBytes($signingInput)
$secretBytes = [System.Text.Encoding]::UTF8.GetBytes($Secret)

# HMAC-SHA256 signature
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = $secretBytes
$signatureBytes = $hmac.ComputeHash($signingBytes)
$signatureEncoded = ConvertTo-Base64UrlEncoding $signatureBytes

$jwt = "$signingInput.$signatureEncoded"

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Canton Dev JWT Generated Successfully" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Party ID:  $PartyId"
Write-Host "Audience:  $Audience"
Write-Host "Expires:   $(Get-Date -Date ([DateTimeOffset]::FromUnixTimeSeconds($exp).DateTime) -Format 'yyyy-MM-dd HH:mm') UTC ($ExpiresInHours hrs)"
Write-Host ""
Write-Host "JWT Token:" -ForegroundColor Yellow
Write-Host $jwt
Write-Host ""
Write-Host "Paste this into .env.local:" -ForegroundColor Yellow
Write-Host "CANTON_JWT=$jwt" -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "IMPORTANT: This dev JWT uses HMAC-HS256. Your Canton participant" -ForegroundColor Red
Write-Host "node must be configured with the same secret in its JWT auth config." -ForegroundColor Red
Write-Host "For cantonnodes.com public API: see their docs for auth token format." -ForegroundColor Red
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
