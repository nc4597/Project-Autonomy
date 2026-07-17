import type { AdminDeal, AdminOfferingType, AdminSector } from "./adminTypes";
import type { Deal, DealType, Sector } from "./types";

export const SECTOR_LABELS: Record<AdminSector, Sector> = {
  AI: "AI",
  HEALTHCARE: "Healthcare",
  ENERGY: "Energy",
  CRYPTO: "Crypto",
  FINTECH: "FinTech",
  DEFENSE: "Defense",
  INFRASTRUCTURE: "Infrastructure",
  REAL_ESTATE: "Real Estate",
  EDTECH: "EdTech",
  PRIVATE_EQUITY: "Private Equity",
  FINANCIAL_SERVICES_ASSET_MANAGEMENT: "Financial Services/Asset Management",
  TELECOMMUNICATIONS: "Telecommunications",
  OTHER: "Other",
};

export const OFFERING_TYPE_LABELS: Record<AdminOfferingType, DealType> = {
  REG_D_506C: "Reg D 506(c)",
  REG_A: "Reg A",
  LP_PLACEMENT: "LP Placement",
  VENTURE: "Venture",
  FUND: "Fund",
  DIRECT_INVESTMENT: "Direct Investment",
  DIRECT_PLACEMENT: "Direct Placement",
};

function deriveInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// The card/catalog components (DealCard, TombstoneCard, FeaturedDealCard)
// were built against a flat, display-ready shape before the admin
// backend existed — this adapts the richer content-model AdminDeal into
// that shape rather than rewriting three already-working components.
export function toCardDeal(deal: AdminDeal): Deal {
  return {
    slug: deal.slug,
    name: deal.name,
    initials: deriveInitials(deal.name),
    logoUrl: deal.logoUrl,
    thumbnailUrl: deal.thumbnailUrl,
    tagline: deal.subheader,
    summary: deal.companyOverview,
    sector: SECTOR_LABELS[deal.sector],
    dealType: OFFERING_TYPE_LABELS[deal.offeringType],
    status: deal.status === "LIVE" ? "live" : "closed",
    raised: deal.raisedAmount,
    goal: deal.raiseGoal,
    minInvestment: deal.minimumInvestment,
    closeDate: deal.closeDate ?? undefined,
  };
}
