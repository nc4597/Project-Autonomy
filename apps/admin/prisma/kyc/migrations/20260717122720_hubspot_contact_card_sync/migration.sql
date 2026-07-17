-- AlterTable
ALTER TABLE "VerificationSubmission" ADD COLUMN     "hubspotContactId" TEXT,
ADD COLUMN     "hubspotSyncError" TEXT,
ADD COLUMN     "hubspotSyncedAt" TIMESTAMP(3);
