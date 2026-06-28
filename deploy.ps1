# HealthVault - redeploy script (Windows / PowerShell)
# Pulls the latest code, installs deps, applies DB migrations, rebuilds the
# frontend, and restarts the API + reloads nginx.
#
# Run from the project root in an elevated PowerShell:
#   .\deploy.ps1
# If blocked by execution policy, run once:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

$ErrorActionPreference = "Stop"

# --- Config: adjust if your nginx lives elsewhere -----------------------------
$NginxDir = "C:\nginx"
# -----------------------------------------------------------------------------

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

# Run a native command and stop if it returns a non-zero exit code.
function Run([string]$desc, [scriptblock]$cmd) {
  Write-Host "==> $desc" -ForegroundColor Cyan
  & $cmd
  if ($LASTEXITCODE -ne 0) { throw "FAILED: $desc (exit $LASTEXITCODE)" }
}

Run "[1/4] Pulling latest code" { git pull --ff-only }

Write-Host "==> [2/4] Backend: install, migrate, restart" -ForegroundColor Cyan
Set-Location "$Root\server"
Run "npm ci"                 { npm ci }
Run "prisma generate"        { npx prisma generate }
Run "prisma migrate deploy"  { npx prisma migrate deploy }

# Restart if the process exists, otherwise start it fresh.
pm2 describe healthvault-api *> $null
if ($LASTEXITCODE -eq 0) {
  Run "pm2 restart" { pm2 restart healthvault-api }
} else {
  Run "pm2 start"   { pm2 start src\index.js --name healthvault-api }
}
pm2 save | Out-Null

Write-Host "==> [3/4] Frontend: install, build" -ForegroundColor Cyan
Set-Location $Root
Run "npm ci"        { npm ci }
Run "npm run build" { npm run build }

Write-Host "==> [4/4] Reloading nginx" -ForegroundColor Cyan
if (Test-Path "$NginxDir\nginx.exe") {
  Push-Location $NginxDir
  & .\nginx.exe -t
  if ($LASTEXITCODE -ne 0) { Pop-Location; throw "nginx config test failed" }
  & .\nginx.exe -s reload
  Pop-Location
} else {
  Write-Host "    nginx.exe not found at $NginxDir - skipping reload (edit \$NginxDir at the top)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==> Done. API status:" -ForegroundColor Green
pm2 status healthvault-api
