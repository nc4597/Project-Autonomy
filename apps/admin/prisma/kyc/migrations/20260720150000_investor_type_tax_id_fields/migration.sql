-- CreateEnum
CREATE TYPE "TaxIdType" AS ENUM ('SSN', 'TIN');

-- AlterTable (preserve existing values: every row collected so far was
-- genuinely an SSN, so the rename + default both stay accurate)
ALTER TABLE "ContactInfo" RENAME COLUMN "ssnLast4" TO "taxIdLast4";
ALTER TABLE "ContactInfo" ADD COLUMN     "taxIdType" "TaxIdType" NOT NULL DEFAULT 'SSN',
ADD COLUMN     "entityName" TEXT,
ADD COLUMN     "entityTaxIdLast4" TEXT,
ADD COLUMN     "coOwnerFirstName" TEXT,
ADD COLUMN     "coOwnerLastName" TEXT,
ADD COLUMN     "coOwnerEmail" TEXT,
ADD COLUMN     "coOwnerDateOfBirth" DATE,
ADD COLUMN     "coOwnerTaxIdType" "TaxIdType",
ADD COLUMN     "coOwnerTaxIdLast4" TEXT;
