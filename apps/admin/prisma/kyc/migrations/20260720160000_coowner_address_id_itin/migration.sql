-- Rename the individual "other tax ID" option from the (incorrect) generic
-- TIN to ITIN — the real number an individual without an SSN holds. TIN is
-- actually the umbrella term for all tax IDs (SSN/ITIN/EIN), so it was never
-- a valid peer of SSN. Data-preserving: no rows used TIN, and the rename
-- keeps existing enum references intact.
ALTER TYPE "TaxIdType" RENAME VALUE 'TIN' TO 'ITIN';

-- Co-owner (joint account) government-ID document slots.
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'CO_OWNER_ID_FRONT';
ALTER TYPE "DocumentCategory" ADD VALUE IF NOT EXISTS 'CO_OWNER_ID_BACK';

-- Co-owner mailing address (populated only for joint accounts; NULL otherwise).
ALTER TABLE "ContactInfo"
  ADD COLUMN "coOwnerStreetAddress" TEXT,
  ADD COLUMN "coOwnerCity" TEXT,
  ADD COLUMN "coOwnerState" TEXT,
  ADD COLUMN "coOwnerZipCode" TEXT;
