# HealthVault — Quick Start

> Full documentation is in **[README.md](./README.md)**. This is the short version.

HealthVault is a multi-tenant hospital platform with a **React/Vite frontend** (port 3000) and an **Express + Prisma + PostgreSQL backend** (port 3001). The frontend proxies `/api` to the backend, so you run both.

## Prerequisites
- Node.js 18+, npm 9+, PostgreSQL 14+

## 1. Database
```sql
CREATE DATABASE healthvault;
```

## 2. Backend (`server/`)
```bash
cd server
npm install
cp .env.example .env          # set DATABASE_URL + JWT_SECRET (see README for all vars)
npx prisma db push            # create tables  (versioned migrations: see server/MIGRATIONS.md)
npx prisma generate
npm run dev                   # → http://localhost:3001
```

## 3. Frontend (project root)
```bash
npm install
npm run dev                   # → http://localhost:3000
```

## 4. First login
Open http://localhost:3000 → **"Set up your account"** to create your hospital and admin. Then, as admin, create credentials (doctors/receptionists) and doctor profiles, and grant permissions.

## Optional integrations (all via `server/.env`, all degrade gracefully if unset)
- **AI summaries** — set any provider key (e.g. `GROQ_API_KEY`, free tier). Models with no key are hidden.
- **Report uploads** — `AZURE_STORAGE_CONNECTION_STRING` (+ configure CORS on the storage account for `PUT`).
- **Premium billing** — `RAZORPAY_KEY_ID/KEY_SECRET/PLAN_ID/WEBHOOK_SECRET`.

## Build for production
```bash
npm run build                 # frontend → dist/
```
See **[PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)** before deploying with real patient data.

## Common issues
- **Port 3000 in use** — change `server.port` in `vite.config.js`.
- **CORS errors** — make sure `ALLOWED_ORIGIN` in `server/.env` includes your frontend origin.
- **DB connection fails** — URL-encode special characters in the password (`@` → `%40`, etc.).
- **"No AI models available"** — set at least one provider API key and restart the backend.
- **Blank screen** — open the browser console (F12); it points to the file/line.
