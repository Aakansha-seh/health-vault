/*
  Warnings:

  - The values [LOGIN,LOGOUT,LOCK_SESSION,VIEW_PATIENT,ADD_PATIENT,UPDATE_PATIENT,ADD_VISIT,EDIT_VISIT,ADD_APPOINTMENT,UPDATE_APPOINTMENT,COMPLETE_APPOINTMENT,CANCEL_APPOINTMENT,GCAL_SYNC,PRINT_PRESCRIPTION,EDIT_PROFILE] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `clinicId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `gcalSynced` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `clinicId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `doctorName` on the `AuditLog` table. All the data in the column will be lost.
  - You are about to drop the column `clinicId` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the `Clinic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Doctor` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `createdBy` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctorProfileId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actorLabel` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actorRole` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospitalId` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registeredBy` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `Visit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `doctorProfileId` to the `Visit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Visit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CredentialRole" AS ENUM ('DOCTOR', 'RECEPTIONIST');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('VIEW', 'READ_WRITE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIALING');

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('ADMIN_LOGIN', 'ADMIN_LOGOUT', 'CREDENTIAL_LOGIN', 'CREDENTIAL_LOGOUT', 'SESSION_LOCKED', 'CREDENTIAL_CREATED', 'CREDENTIAL_UPDATED', 'CREDENTIAL_REVOKED', 'CREDENTIAL_REACTIVATED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'PERMISSION_REQUEST_SENT', 'PERMISSION_REQUEST_APPROVED', 'PERMISSION_REQUEST_DENIED', 'PATIENT_CREATED', 'PATIENT_UPDATED', 'PATIENT_VIEWED', 'VISIT_CREATED', 'VISIT_UPDATED', 'VISIT_VIEWED', 'APPOINTMENT_CREATED', 'APPOINTMENT_UPDATED', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_COMPLETED', 'AI_SUMMARY_GENERATED', 'SUBSCRIPTION_UPGRADED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_RENEWED', 'DOCTOR_PROFILE_UPDATED');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "Visit" DROP CONSTRAINT "Visit_doctorId_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "clinicId",
DROP COLUMN "doctorId",
DROP COLUMN "gcalSynced",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "doctorProfileId" TEXT NOT NULL,
ADD COLUMN     "hospitalId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "clinicId",
DROP COLUMN "doctorId",
DROP COLUMN "doctorName",
ADD COLUMN     "actorLabel" TEXT NOT NULL,
ADD COLUMN     "actorRole" TEXT NOT NULL,
ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "credentialId" TEXT,
ADD COLUMN     "hospitalId" TEXT NOT NULL,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "targetId" TEXT,
ADD COLUMN     "targetLabel" TEXT,
ADD COLUMN     "targetType" TEXT;

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "clinicId",
ADD COLUMN     "dob" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "hospitalId" TEXT NOT NULL,
ADD COLUMN     "medicalHistory" TEXT,
ADD COLUMN     "registeredBy" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "age" DROP NOT NULL,
ALTER COLUMN "gender" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "doctorId",
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "doctorProfileId" TEXT NOT NULL,
ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "prescription" TEXT,
ADD COLUMN     "testsPrescribed" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- DropTable
DROP TABLE "Clinic";

-- DropTable
DROP TABLE "Doctor";

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "CredentialRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hospitalId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "qualification" TEXT,
    "registration" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "bio" TEXT,
    "hospitalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileAccess" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "permission" "Permission" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT NOT NULL,

    CONSTRAINT "ProfileAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionRequest" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "doctorProfileId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,

    CONSTRAINT "PermissionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "gatewayCustomerId" TEXT,
    "gatewaySubscriptionId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsage" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_email_key" ON "Hospital"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_username_key" ON "Credential"("username");

-- CreateIndex
CREATE INDEX "Credential_hospitalId_idx" ON "Credential"("hospitalId");

-- CreateIndex
CREATE INDEX "DoctorProfile_hospitalId_idx" ON "DoctorProfile"("hospitalId");

-- CreateIndex
CREATE INDEX "ProfileAccess_doctorProfileId_idx" ON "ProfileAccess"("doctorProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileAccess_credentialId_doctorProfileId_key" ON "ProfileAccess"("credentialId", "doctorProfileId");

-- CreateIndex
CREATE INDEX "PermissionRequest_credentialId_idx" ON "PermissionRequest"("credentialId");

-- CreateIndex
CREATE INDEX "PermissionRequest_doctorProfileId_idx" ON "PermissionRequest"("doctorProfileId");

-- CreateIndex
CREATE INDEX "PermissionRequest_status_idx" ON "PermissionRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_credentialId_key" ON "Subscription"("credentialId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_gatewayCustomerId_key" ON "Subscription"("gatewayCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_gatewaySubscriptionId_key" ON "Subscription"("gatewaySubscriptionId");

-- CreateIndex
CREATE INDEX "AIUsage_credentialId_createdAt_idx" ON "AIUsage"("credentialId", "createdAt");

-- CreateIndex
CREATE INDEX "Appointment_hospitalId_date_idx" ON "Appointment"("hospitalId", "date");

-- CreateIndex
CREATE INDEX "Appointment_doctorProfileId_date_time_idx" ON "Appointment"("doctorProfileId", "date", "time");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "AuditLog_hospitalId_timestamp_idx" ON "AuditLog"("hospitalId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_credentialId_idx" ON "AuditLog"("credentialId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Patient_hospitalId_createdAt_idx" ON "Patient"("hospitalId", "createdAt");

-- CreateIndex
CREATE INDEX "Patient_hospitalId_name_idx" ON "Patient"("hospitalId", "name");

-- CreateIndex
CREATE INDEX "Visit_patientId_date_idx" ON "Visit"("patientId", "date");

-- CreateIndex
CREATE INDEX "Visit_doctorProfileId_date_idx" ON "Visit"("doctorProfileId", "date");

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAccess" ADD CONSTRAINT "ProfileAccess_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAccess" ADD CONSTRAINT "ProfileAccess_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileAccess" ADD CONSTRAINT "ProfileAccess_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRequest" ADD CONSTRAINT "PermissionRequest_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRequest" ADD CONSTRAINT "PermissionRequest_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionRequest" ADD CONSTRAINT "PermissionRequest_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_registeredBy_fkey" FOREIGN KEY ("registeredBy") REFERENCES "Credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorProfileId_fkey" FOREIGN KEY ("doctorProfileId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsage" ADD CONSTRAINT "AIUsage_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsage" ADD CONSTRAINT "AIUsage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE SET NULL ON UPDATE CASCADE;
