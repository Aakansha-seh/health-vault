# HealthVault — Production Readiness Guide

This is the honest, prioritized path from "working prototype" to "deployable, secure, scalable product you can sell to hospitals." It reflects what is **already built**, what is **partially done**, and what **still needs work or your input** (API keys, infrastructure, legal/compliance).

> ⚠️ **Reality check for healthcare software.** This app handles Protected Health Information (PHI). Shipping it to real hospitals is not just an engineering task — it requires a security review, a legal/compliance review (HIPAA in the US, GDPR in the EU, India's DPDP Act, etc.), signed Business Associate Agreements with every vendor (Azure, Stripe, each AI provider), and likely an external penetration test. Code alone does not make you compliant. Budget for this.

---

## 1. What's already in place ✅

| Area | Status |
|---|---|
| Multi-tenant model (Hospital → Admin → Credentials) | Done — every query is scoped by `hospitalId` |
| Role-based access (Admin / Doctor / Receptionist) | Done |
| Per-profile permissions (VIEW / READ_WRITE), grant & revoke | Done — credentials only see profiles they're granted; revoke-to-VIEW = remove write, revoke entirely = remove access |
| Audit log of every significant action | Done — immutable `AuditLog`, written on auth, CRUD, permission, AI, billing events |
| Password hashing | Done — bcrypt, cost 12 |
| JWT auth, admin vs credential token types | Done |
| Input validation | Done — Zod on every write endpoint |
| Rate limiting (general / auth / AI) | Done — `express-rate-limit` |
| Security headers | Done — `helmet` |
| CORS allow-list | Done — env-driven |
| Multi-provider AI (GPT, Claude, Gemini, DeepSeek, Groq, Perplexity, z.ai, Mistral) | Done — models auto-hidden unless their key is configured |
| Free/Premium AI tiers + monthly usage cap | Done |
| Stripe Checkout + Billing Portal + webhooks | Done — needs your keys + a Price |
| Azure Blob report uploads (SAS, direct-to-blob) | Done — needs your connection string + CORS on the account |
| Pagination on large lists (patients, audit) | Done |
| Responsive layout + PWA | Mostly done |

---

## 2. Required steps to run what's built

```bash
# Backend
cd server
npm install                 # pulls @azure/storage-blob, stripe, AI SDKs
npx prisma db push          # apply the latest schema (new patient/visit columns)
npx prisma generate
npm run dev

# Frontend
cd ..
npm install
npm run dev
```

Fill in `server/.env`:
- `DATABASE_URL` (Postgres)
- `JWT_SECRET` (long random string — **rotate the committed default**)
- At least one `*_API_KEY` for AI
- `AZURE_STORAGE_CONNECTION_STRING` for uploads (and configure CORS on the storage account to allow `PUT` from your app origin)
- `STRIPE_SECRET_KEY`, `STRIPE_PREMIUM_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` for payments

---

## 3. Security — must-fix before real PHI

These are the gaps between "good prototype security" and "safe for patient data."

1. **Secrets management.** `server/.env` currently contains a real DB password and JWT secret and is in the repo tree. Move secrets to a secret manager (Azure Key Vault / Doppler / GitHub Actions secrets). Rotate the JWT secret and DB password now — assume the committed ones are compromised. Confirm `.env` is git-ignored.
2. **HTTPS everywhere.** Terminate TLS at the load balancer/reverse proxy. Set `Strict-Transport-Security`. JWTs and PHI must never travel over plain HTTP.
3. **Token lifecycle.** Today JWTs are 12h with no revocation. Add short-lived access tokens + refresh tokens, and a server-side denylist (or token-version column) so "revoke credential" instantly kills active sessions. Right now a revoked credential's existing JWT works until expiry (middleware does re-check `isActive` on each request for credentials — good — but admins are pure-JWT; add an admin check too).
4. **Account lockout / brute force.** Rate limiting helps; add progressive lockout + alerting on repeated auth failures.
5. **Encryption at rest.** Enable Postgres disk encryption (managed Postgres does this) and consider column-level encryption for the most sensitive PHI fields. Azure Blob is encrypted at rest by default.
6. **Least-privilege everywhere.** Audit each route's authorize step (mostly done). Add automated tests that a credential from hospital A can never read hospital B's data (tenant-isolation tests).
7. **Dependency & container scanning.** `npm audit`, Dependabot/Renovate, and image scanning in CI.
8. **PII in logs.** Ensure error logs and audit `details` never dump full PHI. Scrub before logging.
9. **AI data-sharing disclosure.** Patient data is sent to third-party AI providers. You need (a) signed BAAs/DPAs with each provider you enable, (b) a way to disable providers that won't sign, and (c) consent/disclosure in your hospital contracts. The model-gating system makes (b) easy — only enable providers you have agreements with.

---

## 4. Database scalability (100s → millions of rows)

- **Add indexes.** Hot query paths need composite indexes. At minimum, add to `schema.prisma`:
  - `Patient`: `@@index([hospitalId, createdAt])`, `@@index([hospitalId, name])`
  - `Visit`: `@@index([patientId, date])`, `@@index([doctorProfileId, date])`
  - `Appointment`: `@@index([hospitalId, date])`, `@@index([doctorProfileId, date, time])`
  - `AuditLog`: `@@index([hospitalId, timestamp])`, `@@index([credentialId])`
  - `ProfileAccess`: already unique on `[credentialId, doctorProfileId]`; add `@@index([doctorProfileId])`
- **Connection pooling.** Use PgBouncer or Prisma Data Proxy/Accelerate. A Node app under load will exhaust raw Postgres connections.
- **Keep pagination everywhere** (done for patients/audit; extend to appointments/visits as data grows).
- **Read replicas** for reporting/dashboard queries once traffic grows.
- **Migrations, not `db push`.** You're currently syncing with `prisma db push` (no migration history). Before production, switch to versioned migrations: `npx prisma migrate dev --name <change>` and deploy with `prisma migrate deploy`. This gives you rollback and a deploy audit trail (one of your stated goals).

---

## 5. Reliability & recovery

- **Automated backups** with point-in-time recovery (managed Postgres gives you this — turn it on, test a restore).
- **Health checks** — `/health` exists; wire it to your orchestrator's liveness/readiness probes.
- **Graceful shutdown** — close the Prisma client and drain in-flight requests on SIGTERM.
- **Idempotent webhooks** — store processed Stripe `event.id`s to avoid double-processing on retries.
- **Blue/green or rolling deploys** with the ability to roll back a bad release (tie to the migration history above).

## 6. Observability

- **Error tracking** — Sentry (frontend + backend) for exceptions with alerting.
- **Structured logging** — replace `console.*` with pino/winston; ship to a log store (Azure Monitor / Datadog).
- **Metrics & alerts** — request latency, error rate, AI spend, DB connections, webhook failures. Alert when something breaks.
- **Uptime monitoring** — external ping on `/health`.

## 7. Performance

- Cache rarely-changing reads (doctor-profile lists, dashboard stats) with short TTLs (in-memory or Redis).
- Put the static frontend behind a CDN.
- The AI calls are the slow path — they're already async and rate-limited; consider a job queue if you add bulk summaries.

---

## 8. SEO — the honest version

Your **app** is a private, authenticated SPA that displays PHI. You do **not** want search engines indexing patient pages — that would be a breach. So "SEO for the app" means two distinct things:

1. **The app shell** (login/landing at the app domain): now has a proper `<title>`, meta description, Open Graph and Twitter cards (done in `index.html`) so shared links look right. That's the appropriate level for a behind-login app.
2. **Real SEO lives on a separate public marketing site** (e.g. `www.healthvault.app` vs `app.healthvault.app`). That site is where you rank for "hospital management software" etc. Best built as a static/SSR site (Next.js, Astro, or even a few static pages) with structured data, sitemap.xml, and robots.txt. The React SPA here is client-rendered and not ideal for SEO by design — which is fine, because it shouldn't be indexed anyway.

Recommendation: add `app.` subdomain `robots.txt` = `Disallow: /` for the app, and do SEO on the marketing site.

## 9. Responsiveness

The layout is already responsive (collapsing sidebar, fluid grids, flex-wrap, mobile-friendly modals). Before launch, test on real breakpoints (360px phone, 768px tablet, 1440px desktop) and fix any table overflow. The intake form is dense — verify it scrolls cleanly on phones.

---

## 10. Testing & CI/CD (currently missing)

- **Automated tests**: unit tests for permission logic, integration tests for tenant isolation and each route, a few end-to-end happy-paths (login → intake → AI summary → upgrade). There are none yet — this is the biggest engineering gap for "production ready."
- **CI**: run lint + tests + `npm audit` on every PR; block merge on failure.
- **CD**: deploy on green main; run `prisma migrate deploy` as a release step.

## 11. Suggested deployment topology (Azure, since you're already using it)

- **Frontend** → Azure Static Web Apps (or any CDN/static host) — build with `npm run build`, serve `dist/`.
- **Backend** → Azure App Service / Container Apps (Dockerize the `server/`).
- **Database** → Azure Database for PostgreSQL (Flexible Server) with backups + PgBouncer.
- **Files** → Azure Blob Storage (already integrated).
- **Secrets** → Azure Key Vault.
- **Payments** → Stripe (point the webhook at `https://api.yourdomain/api/webhooks/stripe`).

---

## 12. Prioritized roadmap

**P0 — before any real patient data touches this:**
1. Rotate & vault all secrets; remove `.env` from the tree.
2. HTTPS + HSTS in front of everything.
3. Switch to Prisma migrations; add the indexes in §4.
4. Refresh-token + instant credential/session revocation.
5. Tenant-isolation integration tests.
6. Backups enabled and a restore tested.
7. Sign BAAs/DPAs with Azure, Stripe, and each AI provider you enable.

**P1 — launch quality:**
8. Sentry + structured logging + alerts.
9. CI with tests, lint, audit.
10. Idempotent webhooks; graceful shutdown.
11. Marketing site for SEO; `robots.txt` noindex on the app.

**P2 — scale & polish:**
12. Redis cache + read replicas as traffic grows.
13. Load testing; tune pool sizes and rate limits.
14. External penetration test.

---

*I can implement any P0/P1 item next — say the word and I'll start with migrations + indexes (lowest risk, highest leverage), or the refresh-token/session-revocation work.*
