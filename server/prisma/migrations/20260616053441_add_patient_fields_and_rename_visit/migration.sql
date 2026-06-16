/*
  Warnings:

  - You are about to drop the column `prescription` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `previousHistory` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `progressSinceLastVisit` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `symptoms` on the `Visit` table. All the data in the column will be lost.
  - You are about to drop the column `testsDone` on the `Visit` table. All the data in the column will be lost.
  - Added the required column `chiefComplaint` to the `Visit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "address" TEXT,
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "bloodGroup" TEXT,
ADD COLUMN     "chronicConditions" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "insurance" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Visit" DROP COLUMN "prescription",
DROP COLUMN "previousHistory",
DROP COLUMN "progressSinceLastVisit",
DROP COLUMN "reason",
DROP COLUMN "symptoms",
DROP COLUMN "testsDone",
ADD COLUMN     "chiefComplaint" TEXT NOT NULL,
ADD COLUMN     "diagnosis" TEXT,
ADD COLUMN     "examination" TEXT,
ADD COLUMN     "medications" TEXT,
ADD COLUMN     "notes" TEXT;
