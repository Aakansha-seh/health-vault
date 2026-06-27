-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "aiSummaryAt" TIMESTAMP(3),
ADD COLUMN     "aiSummaryModel" TEXT;

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "visitId" TEXT,
    "storedName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reportType" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Attachment_hospitalId_idx" ON "Attachment"("hospitalId");
