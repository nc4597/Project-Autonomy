// Mirrors the shape apps/admin's /api/public/* routes return (see
// apps/admin/src/lib/serialize.ts and prisma/schema.prisma) — the raw
// content model, richer than the card-level `Deal` type in ./types.ts.

export type AdminSector =
  | "AI"
  | "HEALTHCARE"
  | "ENERGY"
  | "CRYPTO"
  | "FINTECH"
  | "DEFENSE"
  | "INFRASTRUCTURE"
  | "REAL_ESTATE"
  | "EDTECH"
  | "PRIVATE_EQUITY"
  | "FINANCIAL_SERVICES_ASSET_MANAGEMENT"
  | "TELECOMMUNICATIONS"
  | "OTHER";

export type AdminOfferingType =
  | "REG_D_506C"
  | "REG_A"
  | "LP_PLACEMENT"
  | "VENTURE"
  | "FUND"
  | "DIRECT_INVESTMENT"
  | "DIRECT_PLACEMENT";

export interface LabelValue {
  id: string;
  label: string;
  value: string;
}

export interface WhyInvestBullet {
  id: string;
  text: string;
}

export interface LeadershipMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string | null;
}

export interface DealFaq {
  id: string;
  question: string;
  answer: string;
}

// Standalone (not deal-scoped) — powers the About page's "Meet the
// Team" section. See apps/admin/prisma/schema.prisma's TeamMember model.
export interface AdminTeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string | null;
  sortOrder: number;
}

export interface AdminDeal {
  id: string;
  slug: string;
  status: "LIVE" | "CLOSED";
  name: string;
  subheader: string;
  sector: AdminSector;
  offeringType: AdminOfferingType;
  logoUrl: string | null;
  /** Deal representative shown on the "Meet the Representative" card. */
  repName?: string | null;
  repPhotoUrl?: string | null;
  thumbnailUrl: string | null;
  bannerImageUrl: string | null;
  raiseGoal: number;
  raisedAmount: number;
  raisedAmountUndisclosed: boolean;
  minimumInvestment: number;
  companyOverview: string;
  closeDate: string | null;
  marketOpportunityNarrative: string | null;
  sidebarFields: LabelValue[];
  snapshotFields: LabelValue[];
  whyInvestBullets: WhyInvestBullet[];
  marketStats: LabelValue[];
  leadership: LeadershipMember[];
  faqs: DealFaq[];
}

export interface AdminSiteSettings {
  capitalRaised: string;
  completedTransactions: string;
  activeDeals: string;
  investorNetwork: string;
  /** About page team section heading — admin-editable in Home Settings. */
  teamSectionTitle?: string;
  /** Team section subtitle; "{count}" renders as the live member count. */
  teamSectionSubtitle?: string;
  featuredDeal: AdminDeal | null;
  featuredClosedDeals: AdminDeal[];
}
