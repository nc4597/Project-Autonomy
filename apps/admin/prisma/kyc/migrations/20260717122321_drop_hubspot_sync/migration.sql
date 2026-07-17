-- DropForeignKey
ALTER TABLE "HubspotSync" DROP CONSTRAINT "HubspotSync_submissionId_fkey";

-- DropTable
DROP TABLE "HubspotSync";

-- DropEnum
DROP TYPE "HubspotSyncStatus";
