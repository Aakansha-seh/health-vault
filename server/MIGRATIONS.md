# Database Migrations Runbook

Your database was built with `prisma db push` (no migration history). The schema
now also includes performance **indexes** (Patient, Visit, Appointment, AuditLog,
ProfileAccess, PermissionRequest, AIUsage, Credential, DoctorProfile) and the
intake columns added earlier. This runbook gets those into your DB and switches
you onto **versioned migrations** so every future change is tracked and rollback-able.

Run everything from the `server/` folder.

---

## A. Development (data is disposable — simplest)

This recreates the DB from the schema and starts a clean migration history.

```bash
# WARNING: wipes all data in the dev database
npx prisma migrate reset --force
npx prisma migrate dev --name init_v2
npx prisma generate
npm run db:seed        # optional, if you use the seed
```

Done. From now on, for any schema change:

```bash
npx prisma migrate dev --name describe_your_change
```

---

## B. Existing data you must keep (baseline an already-pushed DB)

Use this if the database already has real data you can't lose. It's the official
Prisma "baseline" flow.

**Step 1 — make the DB match the schema (adds the new columns + indexes):**
```bash
npx prisma db push
```

**Step 2 — generate a baseline migration from the current schema:**
```bash
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql
```

**Step 3 — mark that baseline as already applied (because the DB already matches):**
```bash
npx prisma migrate resolve --applied 0_init
```

**Step 4 — delete the old v1 migration folders** (`20260615…_init`,
`20260616…_add_patient_fields…`) so only `0_init` remains as the baseline.

**Step 5 — verify status is clean:**
```bash
npx prisma migrate status
```

From now on, schema changes go through:
```bash
npx prisma migrate dev --name describe_your_change   # creates + applies in dev
```

---

## C. Deploying migrations to production

In your release pipeline, **before** starting the new app version:
```bash
npx prisma migrate deploy
```
This applies any pending migrations non-interactively and is safe to run on every
deploy (it's a no-op when there's nothing new). Pair it with a DB backup taken
immediately before, so a bad migration can be rolled back by restoring.

---

## D. Just want the indexes right now (no migration adoption yet)

If you only want the performance indexes applied immediately and will adopt
migrations later:
```bash
npx prisma db push
```
`db push` is safe here — adding indexes and nullable columns doesn't drop data.
(Large tables: creating an index briefly locks writes; on big production tables
prefer `CREATE INDEX CONCURRENTLY` run manually during a low-traffic window.)
