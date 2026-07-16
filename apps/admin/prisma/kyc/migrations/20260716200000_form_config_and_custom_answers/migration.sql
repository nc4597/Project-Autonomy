-- Source of funds becomes editable from the admin form editor, so the
-- column stores the option's display label as text instead of an enum.
ALTER TABLE "KycAmlInfo" ALTER COLUMN "sourceOfFunds" TYPE TEXT USING "sourceOfFunds"::text;
DROP TYPE "SourceOfFunds";

-- Convert existing enum codes to the display labels the form now stores.
UPDATE "KycAmlInfo" SET "sourceOfFunds" = CASE "sourceOfFunds"
  WHEN 'EMPLOYMENT_SALARY' THEN 'Employment / Salary'
  WHEN 'BUSINESS_INCOME' THEN 'Business Income'
  WHEN 'INHERITANCE' THEN 'Inheritance'
  WHEN 'INVESTMENTS' THEN 'Investment Income'
  WHEN 'SALE_OF_ASSETS' THEN 'Sale of Assets'
  WHEN 'OTHER' THEN 'Other'
  ELSE "sourceOfFunds"
END;

-- CreateTable
CREATE TABLE "CustomAnswer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationFormConfig" (
    "id" TEXT NOT NULL,
    "draft" JSONB NOT NULL,
    "published" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationFormConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomAnswer_submissionId_fieldKey_key" ON "CustomAnswer"("submissionId", "fieldKey");

-- AddForeignKey
ALTER TABLE "CustomAnswer" ADD CONSTRAINT "CustomAnswer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "VerificationSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
