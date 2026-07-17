-- AlterTable
ALTER TABLE "VerificationSubmission" ADD COLUMN     "clientSecret" TEXT,
ADD COLUMN     "firstSubmittedAt" TIMESTAMP(3);

-- Existing submissions: their one known submission date is the original.
UPDATE "VerificationSubmission" SET "firstSubmittedAt" = "submittedAt" WHERE "submittedAt" IS NOT NULL;
