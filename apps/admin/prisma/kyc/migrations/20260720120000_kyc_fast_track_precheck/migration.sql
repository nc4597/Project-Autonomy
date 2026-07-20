-- AlterTable
ALTER TABLE "VerificationSubmission" ADD COLUMN     "fastTracked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fastTrackedFromId" TEXT;
