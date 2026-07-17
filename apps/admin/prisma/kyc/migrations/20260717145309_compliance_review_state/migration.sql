-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterTable
ALTER TABLE "VerificationSubmission" ADD COLUMN     "reviewNotes" TEXT,
ADD COLUMN     "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reviewedAt" TIMESTAMP(3);
