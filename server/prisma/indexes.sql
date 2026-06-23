-- HealthVault — Production Indexes
-- Run after prisma migrate: psql $DATABASE_URL -f prisma/indexes.sql
-- Designed for scale: 10k+ users, millions of rows per table

-- ─── Hospital ────────────────────────────────────────────────────────────────
-- Already unique on email (from schema)

-- ─── Admin ───────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_hospital_id
  ON "Admin" ("hospitalId");

-- ─── Credential ──────────────────────────────────────────────────────────────
-- Already unique on username (from schema)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credential_hospital_id
  ON "Credential" ("hospitalId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credential_hospital_active
  ON "Credential" ("hospitalId", "isActive");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credential_role
  ON "Credential" ("hospitalId", "role");

-- ─── DoctorProfile ───────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_doctor_profile_hospital_id
  ON "DoctorProfile" ("hospitalId");

-- ─── ProfileAccess ───────────────────────────────────────────────────────────
-- Already unique on (credentialId, doctorProfileId) — that IS the index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_access_credential
  ON "ProfileAccess" ("credentialId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profile_access_profile
  ON "ProfileAccess" ("doctorProfileId");

-- ─── PermissionRequest ───────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_request_credential
  ON "PermissionRequest" ("credentialId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permission_request_status
  ON "PermissionRequest" ("status")
  WHERE "status" = 'PENDING';  -- partial index — only pending matters for queries

-- ─── Patient ─────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_hospital_id
  ON "Patient" ("hospitalId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_hospital_created
  ON "Patient" ("hospitalId", "createdAt" DESC);

-- Full-text search on patient name (for /api/patients?search=)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_patient_name_trgm
  ON "Patient" USING gin ("name" gin_trgm_ops);
-- NOTE: requires pg_trgm extension: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Visit ───────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visit_patient_id
  ON "Visit" ("patientId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visit_doctor_profile
  ON "Visit" ("doctorProfileId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visit_date
  ON "Visit" ("doctorProfileId", "date" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visit_hospital_month
  ON "Visit" ("date");  -- used for monthly chart queries

-- ─── Appointment ─────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_hospital
  ON "Appointment" ("hospitalId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_doctor_profile
  ON "Appointment" ("doctorProfileId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_patient
  ON "Appointment" ("patientId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointment_upcoming
  ON "Appointment" ("hospitalId", "status", "date")
  WHERE "status" = 'scheduled';  -- partial index for upcoming query

-- ─── AIUsage ─────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_aiusage_credential_month
  ON "AIUsage" ("credentialId", "createdAt" DESC);
-- Used to count monthly usage: WHERE credentialId = X AND createdAt >= start_of_month

-- ─── Subscription ────────────────────────────────────────────────────────────
-- Already unique on credentialId — that IS the index

-- ─── AuditLog ────────────────────────────────────────────────────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_hospital_timestamp
  ON "AuditLog" ("hospitalId", "timestamp" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_hospital_action
  ON "AuditLog" ("hospitalId", "action");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_actor_credential
  ON "AuditLog" ("credentialId")
  WHERE "credentialId" IS NOT NULL;

-- ─── Enable pg_trgm for fuzzy name search ────────────────────────────────────
-- Run once on the database:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
