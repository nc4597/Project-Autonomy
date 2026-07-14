-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "InvestorType" AS ENUM ('INDIVIDUAL', 'JOINT', 'ENTITY_TRUST');

-- CreateEnum
CREATE TYPE "SourceOfFunds" AS ENUM ('EMPLOYMENT_SALARY', 'BUSINESS_INCOME', 'INHERITANCE', 'INVESTMENTS', 'SALE_OF_ASSETS', 'OTHER');

-- CreateEnum
CREATE TYPE "AccreditationMethod" AS ENUM ('ANNUAL_INCOME', 'NET_WORTH', 'PROFESSIONAL_CERTIFICATION', 'ENTITY_QUALIFICATION', 'KNOWLEDGEABLE_EMPLOYEE');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('ID_FRONT', 'ID_BACK', 'PROOF_OF_ADDRESS', 'ENTITY_FORMATION_DOC', 'INCOME_TAX_RETURN', 'BROKERAGE_STATEMENT', 'BANK_STATEMENT', 'CPA_NET_WORTH_LETTER', 'FINRA_CRD_OR_LICENSE', 'ENTITY_FINANCIALS_OR_TAX_RETURNS', 'CAP_TABLE', 'EMPLOYMENT_VERIFICATION_OR_FUND_CERT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'UPLOADED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HubspotSyncStatus" AS ENUM ('NOT_CONFIGURED', 'PENDING', 'SYNCED', 'FAILED');

-- CreateTable
CREATE TABLE "VerificationSubmission" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "VerificationSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInfo" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "ssnLast4" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "investorType" "InvestorType" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycAmlInfo" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "countryOfCitizenship" TEXT NOT NULL,
    "taxResidence" TEXT NOT NULL,
    "sourceOfFunds" "SourceOfFunds" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycAmlInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccreditationInfo" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "method" "AccreditationMethod" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccreditationInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "s3Key" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationAcceptance" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL,
    "tosVersion" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,

    CONSTRAINT "CertificationAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HubspotSync" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "status" "HubspotSyncStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "hubspotContactId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "HubspotSync_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationSubmission_dealId_idx" ON "VerificationSubmission"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactInfo_submissionId_key" ON "ContactInfo"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "KycAmlInfo_submissionId_key" ON "KycAmlInfo"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "AccreditationInfo_submissionId_key" ON "AccreditationInfo"("submissionId");

-- CreateIndex
CREATE INDEX "Document_submissionId_idx" ON "Document"("submissionId");

-- CreateIndex
CREATE INDEX "Document_submissionId_category_idx" ON "Document"("submissionId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CertificationAcceptance_submissionId_key" ON "CertificationAcceptance"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "HubspotSync_submissionId_key" ON "HubspotSync"("submissionId");

-- AddForeignKey
ALTER TABLE "ContactInfo" ADD CONSTRAINT "ContactInfo_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "VerificationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycAmlInfo" ADD CONSTRAINT "KycAmlInfo_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "VerificationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccreditationInfo" ADD CONSTRAINT "AccreditationInfo_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "VerificationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "VerificationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationAcceptance" ADD CONSTRAINT "CertificationAcceptance_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "VerificationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HubspotSync" ADD CONSTRAINT "HubspotSync_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "VerificationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
