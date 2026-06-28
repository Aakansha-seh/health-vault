# HealthVault — Deployment Guide

This guide covers deploying HealthVault on a fresh server, for both **Ubuntu/Linux**
and **Windows**. It assumes you're deploying from the GitHub repo.

---

## 1. Architecture (what you're deploying)

Three moving parts:

1. **PostgreSQL** — the database.
2. **Backend API** — Node/Express (`server/`), runs as a long-lived process on a port (default `3001`), kept alive by **pm2**.
3. **Frontend** — a Vite/React app that is **built into static files** (`dist/`) and served by **nginx**, which also reverse-proxies `/api` to the backend.

```
Browser ──HTTPS──► nginx ──/ (static dist)──► React app
                     └────/api/* ──► Node API (localhost:3001) ──► PostgreSQL
                                              └──► uploads/ (report files on disk)
```

Both OS use the same three tools (PostgreSQL, Node + pm2, nginx) so the steps stay parallel.

---

## 2. Prerequisites

You need a server you can log into, with admin rights, and a domain name pointing at it (for HTTPS).

### Ubuntu
```bash
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -   # Node 20 LTS
sudo apt install -y nodejs git nginx postgresql
sudo npm install -g pm2
```

### Windows (PowerShell, as Administrator)
```powershell
winget install OpenJS.NodeJS.LTS        # Node 20 LTS
winget install Git.Git
winget install PostgreSQL.PostgreSQL     # or download the EnterpriseDB installer
npm install -g pm2 pm2-windows-startup
pm2-startup install                      # lets pm2 restart the API on reboot
```
Download **nginx for Windows** from <https://nginx.org/en/download.html>, unzip to e.g. `C:\nginx`.

> Close and reopen your terminal after installing, so `node`, `git`, `psql`, and `pm2` are on the PATH.

---

## 3. First-time deploy — Ubuntu

```bash
# 1) Get the code
sudo mkdir -p /srv && cd /srv
git clone <YOUR_GITHUB_REPO_URL> healthvault
cd healthvault

# 2) Create the database
sudo -u postgres psql -c "CREATE DATABASE healthvault;"
sudo -u postgres psql -c "CREATE USER hvuser WITH PASSWORD '<DB_PASSWORD>';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE healthvault TO hvuser;"
sudo -u postgres psql -d healthvault -c "GRANT ALL ON SCHEMA public TO hvuser;"   # PG 15+

# 3) Backend
cd /srv/healthvault/server
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"   # copy this for JWT_SECRET
nano .env                       # fill in values (see section 5)
npm ci
npx prisma generate
npx prisma migrate deploy        # creates ALL tables
mkdir -p uploads                 # report-file storage (or set UPLOAD_DIR elsewhere)
# node prisma/seed.js            # OPTIONAL demo hospital/admin; skip to register via the app
pm2 start src/index.js --name healthvault-api
pm2 save
pm2 startup                      # run the command it prints (enables start-on-boot)

# 4) Frontend
cd /srv/healthvault
npm ci
npm run build                    # outputs to /srv/healthvault/dist

# 5) nginx
sudo cp /srv/healthvault/deploy/nginx.conf /etc/nginx/sites-available/healthvault 2>/dev/null || true
sudo nano /etc/nginx/sites-available/healthvault   # paste the config from section 6
sudo ln -s /etc/nginx/sites-available/healthvault /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6) HTTPS
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 4. First-time deploy — Windows

Run PowerShell **as Administrator**. Use `C:\srv\healthvault` as the project path.

```powershell
# 1) Get the code
New-Item -ItemType Directory -Force C:\srv | Out-Null
cd C:\srv
git clone <YOUR_GITHUB_REPO_URL> healthvault
cd healthvault

# 2) Create the database
#    Open "SQL Shell (psql)" from the Start menu (or use pgAdmin) and run:
#       CREATE DATABASE healthvault;
#       CREATE USER hvuser WITH PASSWORD '<DB_PASSWORD>';
#       GRANT ALL PRIVILEGES ON DATABASE healthvault TO hvuser;
#       \c healthvault
#       GRANT ALL ON SCHEMA public TO hvuser;

# 3) Backend
cd C:\srv\healthvault\server
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"   # copy for JWT_SECRET
notepad .env                     # fill in values (see section 5)
npm ci
npx prisma generate
npx prisma migrate deploy        # creates ALL tables
New-Item -ItemType Directory -Force .\uploads | Out-Null
# node prisma/seed.js            # OPTIONAL demo hospital/admin
pm2 start src\index.js --name healthvault-api
pm2 save

# 4) Frontend
cd C:\srv\healthvault
npm ci
npm run build                    # outputs to C:\srv\healthvault\dist

# 5) nginx (from your nginx folder, e.g. C:\nginx)
#    Edit C:\nginx\conf\nginx.conf — paste the server block from section 6,
#    using FORWARD SLASHES in the root path: C:/srv/healthvault/dist
cd C:\nginx
start nginx                      # first start
# nginx -s reload                # after later config changes
```

**HTTPS on Windows:** use **win-acme** (<https://www.win-acme.com/>) to obtain and install
a Let's Encrypt certificate for nginx, or terminate TLS at a load balancer / IIS in front.

---

## 5. Environment variables (`server/.env`)

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://hvuser:<DB_PASSWORD>@localhost:5432/healthvault?schema=public` |
| `PORT` | – | API port, default `3001` |
| `NODE_ENV` | ✅ | set to `production` |
| `ALLOWED_ORIGIN` | ✅ | **must equal your site URL**, e.g. `https://yourdomain.com` (CORS) |
| `JWT_SECRET` | ✅ | long random string — generate with the `node -e` command above |
| `JWT_EXPIRES_IN` | – | default `12h` |
| `UPLOAD_DIR` | ✅(prod) | absolute path for report files, e.g. `/srv/healthvault/server/uploads` or `C:/srv/healthvault/server/uploads` |
| `UPLOAD_MAX_MB` | – | per-file cap, default `15` |
| `GROQ_API_KEY` (or other AI key) | for AI | at least one AI provider key enables AI summaries (Groq has a free tier) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_AI_API_KEY` | optional | additional AI providers |
| `AI_FREE_MONTHLY_LIMIT` | – | default `10` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / webhook secret | for billing | only if you use subscriptions |
| `RATE_LIMIT_*` | – | request caps (sensible defaults) |

The frontend defaults its API base to `/api`, which works behind the nginx proxy below.
If you serve the frontend on a different origin from the API, set `VITE_API_URL` **before** `npm run build`.

---

## 6. nginx config (same for both OS)

```nginx
server {
  listen 80;
  server_name yourdomain.com;

  # Ubuntu:  root /srv/healthvault/dist;
  # Windows: root C:/srv/healthvault/dist;   (use forward slashes)
  root /srv/healthvault/dist;
  index index.html;

  client_max_body_size 25m;          # MUST match the 25mb upload body limit

  location /api/ {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri /index.html;      # SPA routing fallback
  }
}
```

---

## 7. Redeploying after you push changes

Use the bundled scripts (run from the project root):

- **Ubuntu:** `./deploy.sh`
- **Windows (PowerShell as Admin):** `.\deploy.ps1`

Each one pulls the latest code, installs deps, applies new DB migrations, rebuilds
the frontend, and restarts the API + reloads nginx. (Make `deploy.sh` executable
once with `chmod +x deploy.sh`.)

---

## 8. Backups & operations

- **Back up the database AND `UPLOAD_DIR` together** — report files live on disk, not in Postgres.
  - DB dump (Ubuntu): `pg_dump -U hvuser healthvault > backup_$(date +%F).sql`
  - DB dump (Windows): `pg_dump -U hvuser healthvault > backup.sql`
  - Files: copy/sync the `uploads/` folder to your backup target.
- **Logs / status:** `pm2 status`, `pm2 logs healthvault-api`, `pm2 restart healthvault-api`.
- **Razorpay (if used):** set the webhook in the Razorpay dashboard to `https://yourdomain.com/api/webhooks`.

---

## 9. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| API won't start: `EADDRINUSE :3001` | An old API process is already running. `pm2 delete healthvault-api` then start again, or free the port. |
| `P1001: Can't reach database server` | PostgreSQL isn't running, or `DATABASE_URL` host/port/password is wrong. |
| Login/API calls fail with CORS errors | `ALLOWED_ORIGIN` doesn't match the site URL. |
| File uploads fail with `413` | Add/raise `client_max_body_size 25m;` in nginx. |
| Uploaded report won't open | The file's bytes aren't in `UPLOAD_DIR` on this server (e.g. uploaded elsewhere) — re-upload. |
| Blank page / 404 on refresh of a deep link | Missing `try_files $uri /index.html;` SPA fallback in nginx. |
| AI summary says "no models available" | No AI provider key set in `server/.env` (add e.g. `GROQ_API_KEY`) and restart the API. |
