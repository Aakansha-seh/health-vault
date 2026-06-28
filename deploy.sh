#!/usr/bin/env bash
#
# HealthVault — redeploy script (Ubuntu/Linux)
# Pulls the latest code, installs deps, applies DB migrations, rebuilds the
# frontend, and restarts the API + reloads nginx.
#
# First time only:  chmod +x deploy.sh
# Run from the project root:  ./deploy.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> [1/4] Pulling latest code"
git pull --ff-only

echo "==> [2/4] Backend: install, migrate, restart"
cd "$ROOT/server"
npm ci
npx prisma generate
npx prisma migrate deploy
# Restart if the process exists, otherwise start it fresh.
if pm2 describe healthvault-api > /dev/null 2>&1; then
  pm2 restart healthvault-api
else
  pm2 start src/index.js --name healthvault-api
fi
pm2 save

echo "==> [3/4] Frontend: install, build"
cd "$ROOT"
npm ci
npm run build

echo "==> [4/4] Reloading nginx"
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "==> Done. API status:"
pm2 status healthvault-api
