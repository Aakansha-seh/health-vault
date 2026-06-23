# HealthVault

A multi-tenant hospital platform: secure patient records, role-based access with per-profile permissions, a full audit trail, AI-assisted clinical summaries (8 providers, free/premium tiers), report uploads to Azure Blob Storage, and recurring billing via Razorpay.

> For the go-live checklist (security, scaling, backups, deployment) see **[PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)**. For database migrations see **[server/MIGRATIONS.md](./server/MIGRATIONS.md)**.

---

## Architecture

```
Frontend (React + Vite PWA, :3000)  ──/api proxy──▶  Backend (Express + Prisma, :3001)  ──▶  PostgreSQL
                                                          │
                                   Azure Blob (reports) · Razorpay (billing) · AI providers
```

- **Frontend** — React 18 + Vite, installable PWA. Dev server on **:3000**, proxies `/api` to the backend.
- **Backend** — Express + Prisma ORM on **:3001**. JWT auth (two token types: admin and credential).
- **Database** — PostgreSQL.

### Roles

| Role | How created | Sees | Can do |
|---|---|---|---|
| **Admin** | Hospital signup (one-time) | Everything in their hospital | Manage credentials, doctor profiles, permissions, audit |
| **Doctor** (credential) | Created by admin | Only patients under profiles they're **granted** | Read/write per granted permission; AI summaries; request write access |
| **Receptionist** (credential) | Created by admin | Hospital-wide (front desk) | Register patients (intake), book appointments |

Every significant action is written to an immutable **audit log**.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| PostgreSQL | 14+ |

---

## Setup

### 1. Database
```sql
CREATE DATABASE healthvault;
```

### 2. Backend
```bash
cd server
npm install
cp .env.example .env        # then edit .env (see "Environment" below)
npx prisma db push          # create tables (or follow server/MIGRATIONS.md for versioned migrations)
npx prisma generate
npm run dev                 # API on http://localhost:3001
```

### 3. Frontend
```bash
# from the project root
npm install
npm run dev                 # app on http://localhost:3000 (proxies /api → :3001)
```

### 4. First run
Open http://localhost:3000 → **Set up your account** to create your hospital + admin, then log in. As admin, create doctor/receptionist **credentials** and **doctor profiles**, and grant access.

---

## Environment (`server/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (URL-encode special chars in the password) |
| `JWT_SECRET` | ✅ | Long random string — **change the default** |
| `ALLOWED_ORIGIN` | ✅ | Comma-separated frontend origins (default `http://localhost:3000,http://localhost:5173`) |
| `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `DEEPSEEK_API_KEY`, `GROQ_API_KEY`, `PERPLEXITY_API_KEY`, `ZAI_API_KEY`, `MISTRAL_API_KEY` | optional | Enable AI models. **A model only appears to doctors if its key is set.** Groq has a free tier — easiest to start with. |
| `AI_FREE_MONTHLY_LIMIT` | optional | Free-tier AI summaries/month (default 10) |
| `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER` | optional | Report uploads. Also configure **CORS on the storage account** to allow `PUT` from your app origin. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_PLAN_ID`, `RAZORPAY_WEBHOOK_SECRET` | optional | Premium AI subscription. Create a recurring **Plan** in the Razorpay dashboard → `RAZORPAY_PLAN_ID`; add a webhook → `/api/webhooks/razorpay`. |

The frontend needs no env in dev (it proxies `/api`). For a split deployment set `VITE_API_URL` to the backend's `/api` URL.

---

## Key flows

- **Patient intake (receptionist):** one form creates the patient + first visit (symptoms, prescription, tests, report uploads) + an optional next appointment, in a single transaction.
- **Permissions:** admin grants a credential **VIEW** or **READ_WRITE** on a doctor profile. A doctor sees/edits only what they're granted; a read-only doctor sees a **"Request edit access"** button, which the admin approves under **Permissions**. Approved/revoked access reflects in the doctor's app within ~20s (no re-login).
- **AI summary (doctor):** pick a patient they have access to + a model, generate a summary. Free tier is capped monthly; Premium unlocks all models and removes the cap.
- **Billing:** Premium upgrade opens the Razorpay Checkout modal (UPI AutoPay / card e-mandate); a webhook flips the plan to Premium. Cancel is at end of cycle.

---

## Scripts

**Backend (`server/`):** `npm run dev` · `npm start` · `npm run db:migrate` · `npm run db:seed` · `npm run db:studio`
**Frontend (root):** `npm run dev` · `npm run build` · `npm run preview`

---

## Tech stack

React · Vite · Recharts · Express · Prisma · PostgreSQL · JWT + bcrypt · Zod · Helmet · express-rate-limit · Azure Blob Storage · Razorpay · OpenAI/Anthropic/Google/DeepSeek/Groq/Perplexity/z.ai/Mistral SDKs.
