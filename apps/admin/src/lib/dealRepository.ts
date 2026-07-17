import { prisma } from "./prisma";
import type { DealInput, SiteSettingsInput } from "./dealSchema";

const dealInclude = {
  sidebarFields: { orderBy: { sortOrder: "asc" as const } },
  snapshotFields: { orderBy: { sortOrder: "asc" as const } },
  whyInvestBullets: { orderBy: { sortOrder: "asc" as const } },
  marketStats: { orderBy: { sortOrder: "asc" as const } },
  leadership: { orderBy: { sortOrder: "asc" as const } },
  faqs: { orderBy: { sortOrder: "asc" as const } },
};

export function listDeals() {
  return prisma.deal.findMany({
    include: dealInclude,
    orderBy: { createdAt: "desc" },
  });
}

export function getDealBySlug(slug: string) {
  return prisma.deal.findUnique({ where: { slug }, include: dealInclude });
}

export function getDealById(id: string) {
  return prisma.deal.findUnique({ where: { id }, include: dealInclude });
}

// Child sections (snapshot fields, leadership, FAQ, etc.) are replaced
// wholesale on every save rather than diffed against existing rows —
// the admin form always submits the full current state of each section,
// and these lists are small enough that delete-and-recreate in one
// transaction is simpler and just as correct as an incremental diff.
export function createDeal(input: DealInput) {
  return prisma.deal.create({
    data: {
      ...scalarFields(input),
      sidebarFields: { create: withSortOrder(input.sidebarFields) },
      snapshotFields: { create: withSortOrder(input.snapshotFields) },
      whyInvestBullets: { create: withSortOrder(input.whyInvestBullets) },
      marketStats: { create: withSortOrder(input.marketStats) },
      leadership: { create: withSortOrder(input.leadership) },
      faqs: { create: withSortOrder(input.faqs) },
    },
    include: dealInclude,
  });
}

export async function updateDeal(id: string, input: DealInput) {
  return prisma.$transaction(async (tx) => {
    await tx.sidebarField.deleteMany({ where: { dealId: id } });
    await tx.snapshotField.deleteMany({ where: { dealId: id } });
    await tx.whyInvestBullet.deleteMany({ where: { dealId: id } });
    await tx.marketStat.deleteMany({ where: { dealId: id } });
    await tx.leadershipMember.deleteMany({ where: { dealId: id } });
    await tx.dealFaq.deleteMany({ where: { dealId: id } });

    return tx.deal.update({
      where: { id },
      data: {
        ...scalarFields(input),
        sidebarFields: { create: withSortOrder(input.sidebarFields) },
        snapshotFields: { create: withSortOrder(input.snapshotFields) },
        whyInvestBullets: { create: withSortOrder(input.whyInvestBullets) },
        marketStats: { create: withSortOrder(input.marketStats) },
        leadership: { create: withSortOrder(input.leadership) },
        faqs: { create: withSortOrder(input.faqs) },
      },
      include: dealInclude,
    });
  });
}

export function deleteDeal(id: string) {
  return prisma.deal.delete({ where: { id } });
}

function scalarFields(input: DealInput) {
  return {
    slug: input.slug,
    status: input.status,
    name: input.name,
    subheader: input.subheader,
    sector: input.sector,
    offeringType: input.offeringType,
    logoUrl: input.logoUrl ?? null,
    thumbnailUrl: input.thumbnailUrl ?? null,
    bannerImageUrl: input.bannerImageUrl ?? null,
    repName: input.repName || null,
    repPhotoUrl: input.repPhotoUrl ?? null,
    repEmail: input.repEmail || null,
    raiseGoal: input.raiseGoal,
    raisedAmount: input.raisedAmount,
    raisedAmountUndisclosed: input.raisedAmountUndisclosed,
    minimumInvestment: input.minimumInvestment,
    companyOverview: input.companyOverview,
    closeDate: input.closeDate ? new Date(input.closeDate) : null,
    marketOpportunityNarrative: input.marketOpportunityNarrative ?? null,
  };
}

function withSortOrder<T extends { id?: string }>(items: T[]) {
  return items.map(({ id: _id, ...rest }, index) => ({ ...rest, sortOrder: index }));
}

export async function getSiteSettings() {
  const [settings, featured, featuredClosed] = await Promise.all([
    prisma.siteSettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    }),
    prisma.featuredDeal.findUnique({
      where: { id: "singleton" },
      include: { deal: { include: dealInclude } },
    }),
    prisma.featuredClosedDeal.findMany({
      orderBy: { sortOrder: "asc" },
      include: { deal: { include: dealInclude } },
    }),
  ]);

  return {
    ...settings,
    featuredDeal: featured?.deal ?? null,
    featuredClosedDeals: featuredClosed.map((row) => row.deal),
  };
}

export async function updateSiteSettings(input: SiteSettingsInput) {
  await prisma.$transaction(async (tx) => {
    await tx.siteSettings.upsert({
      where: { id: "singleton" },
      update: {
        capitalRaised: input.capitalRaised,
        completedTransactions: input.completedTransactions,
        activeDeals: input.activeDeals,
        investorNetwork: input.investorNetwork,
      },
      create: {
        id: "singleton",
        capitalRaised: input.capitalRaised,
        completedTransactions: input.completedTransactions,
        activeDeals: input.activeDeals,
        investorNetwork: input.investorNetwork,
      },
    });

    if (input.featuredDealId) {
      await tx.featuredDeal.upsert({
        where: { id: "singleton" },
        update: { dealId: input.featuredDealId },
        create: { id: "singleton", dealId: input.featuredDealId },
      });
    } else {
      await tx.featuredDeal.deleteMany({});
    }

    await tx.featuredClosedDeal.deleteMany({});
    if (input.featuredClosedDealIds.length > 0) {
      await tx.featuredClosedDeal.createMany({
        data: input.featuredClosedDealIds.map((dealId, index) => ({
          dealId,
          sortOrder: index,
        })),
      });
    }
  });

  return getSiteSettings();
}
