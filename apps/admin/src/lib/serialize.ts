import type { Deal, SnapshotField, WhyInvestBullet, MarketStat, LeadershipMember, DealFaq } from "@prisma/client";

type DealWithRelations = Deal & {
  snapshotFields: SnapshotField[];
  whyInvestBullets: WhyInvestBullet[];
  marketStats: MarketStat[];
  leadership: LeadershipMember[];
  faqs: DealFaq[];
};

// Prisma's Decimal fields aren't plain numbers, so they don't survive
// JSON.stringify the way callers expect — this makes the API's number
// fields actually behave like numbers on the wire.
export function serializeDeal(deal: DealWithRelations) {
  return {
    ...deal,
    raiseGoal: Number(deal.raiseGoal),
    raisedAmount: Number(deal.raisedAmount),
    minimumInvestment: Number(deal.minimumInvestment),
  };
}

export function serializeDeals(deals: DealWithRelations[]) {
  return deals.map(serializeDeal);
}
