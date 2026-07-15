-- CreateTable
CREATE TABLE "SidebarField" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SidebarField_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SidebarField" ADD CONSTRAINT "SidebarField_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing investmentVehicle/regulation values into SidebarField rows
-- rather than discarding them.
INSERT INTO "SidebarField" ("id", "dealId", "label", "value", "sortOrder")
SELECT gen_random_uuid()::text, "id", 'Investment Vehicle', "investmentVehicle", 0
FROM "Deal"
WHERE "investmentVehicle" IS NOT NULL AND "investmentVehicle" != '';

INSERT INTO "SidebarField" ("id", "dealId", "label", "value", "sortOrder")
SELECT gen_random_uuid()::text, "id", 'Regulation', "regulation", 1
FROM "Deal"
WHERE "regulation" IS NOT NULL AND "regulation" != '';

-- AlterTable
ALTER TABLE "Deal" DROP COLUMN "investmentVehicle",
DROP COLUMN "regulation";
