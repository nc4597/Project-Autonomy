-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('LIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('AI', 'HEALTHCARE', 'ENERGY', 'CRYPTO', 'FINTECH', 'DEFENSE', 'INFRASTRUCTURE', 'REAL_ESTATE');

-- CreateEnum
CREATE TYPE "OfferingType" AS ENUM ('REG_D_506C', 'REG_A', 'LP_PLACEMENT', 'VENTURE', 'FUND');

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'LIVE',
    "name" TEXT NOT NULL,
    "subheader" TEXT NOT NULL,
    "sector" "Sector" NOT NULL,
    "offeringType" "OfferingType" NOT NULL,
    "logoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "raiseGoal" DECIMAL(14,2) NOT NULL,
    "raisedAmount" DECIMAL(14,2) NOT NULL,
    "minimumInvestment" DECIMAL(14,2) NOT NULL,
    "companyOverview" TEXT NOT NULL,
    "closeDate" TIMESTAMP(3),
    "bannerImageUrl" TEXT,
    "investmentVehicle" TEXT,
    "regulation" TEXT,
    "marketOpportunityNarrative" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SnapshotField" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SnapshotField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhyInvestBullet" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WhyInvestBullet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketStat" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarketStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadershipMember" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "photoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeadershipMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealFaq" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DealFaq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "capitalRaised" TEXT NOT NULL DEFAULT '$0',
    "completedTransactions" TEXT NOT NULL DEFAULT '0',
    "activeDeals" TEXT NOT NULL DEFAULT '0',
    "investorNetwork" TEXT NOT NULL DEFAULT '0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedDeal" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "dealId" TEXT NOT NULL,

    CONSTRAINT "FeaturedDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturedClosedDeal" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FeaturedClosedDeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Deal_slug_key" ON "Deal"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedDeal_dealId_key" ON "FeaturedDeal"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedClosedDeal_dealId_key" ON "FeaturedClosedDeal"("dealId");

-- AddForeignKey
ALTER TABLE "SnapshotField" ADD CONSTRAINT "SnapshotField_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhyInvestBullet" ADD CONSTRAINT "WhyInvestBullet_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketStat" ADD CONSTRAINT "MarketStat_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadershipMember" ADD CONSTRAINT "LeadershipMember_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealFaq" ADD CONSTRAINT "DealFaq_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedDeal" ADD CONSTRAINT "FeaturedDeal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturedClosedDeal" ADD CONSTRAINT "FeaturedClosedDeal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
