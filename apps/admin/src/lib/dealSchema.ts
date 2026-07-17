import { z } from "zod";

export const SECTORS = [
  "AI",
  "HEALTHCARE",
  "ENERGY",
  "CRYPTO",
  "FINTECH",
  "DEFENSE",
  "INFRASTRUCTURE",
  "REAL_ESTATE",
  "EDTECH",
  "PRIVATE_EQUITY",
  "FINANCIAL_SERVICES_ASSET_MANAGEMENT",
  "TELECOMMUNICATIONS",
  "OTHER",
] as const;

export const OFFERING_TYPES = [
  "REG_D_506C",
  "REG_A",
  "LP_PLACEMENT",
  "VENTURE",
  "FUND",
  "DIRECT_INVESTMENT",
  "DIRECT_PLACEMENT",
] as const;

// Nothing below is required for now — the admin form is still being
// tested and content gets filled in incrementally, so validation only
// enforces shape/type, not completeness. Revisit before this is used
// for real deals (a deal with no name/slug is a broken public page).
const labelValueSchema = z.object({
  id: z.string().optional(),
  label: z.string().default(""),
  value: z.string().default(""),
});

const bulletSchema = z.object({
  id: z.string().optional(),
  text: z.string().default(""),
});

const leadershipSchema = z.object({
  id: z.string().optional(),
  name: z.string().default(""),
  title: z.string().default(""),
  bio: z.string().default(""),
  photoUrl: z.string().optional().nullable(),
});

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().default(""),
  answer: z.string().default(""),
});

export const dealInputSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9-]*$/, "Slug must be lowercase letters, numbers, and hyphens only")
    .default(""),
  status: z.enum(["LIVE", "CLOSED"]),
  name: z.string().default(""),
  subheader: z.string().default(""),
  sector: z.enum(SECTORS),
  offeringType: z.enum(OFFERING_TYPES),
  logoUrl: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  bannerImageUrl: z.string().optional().nullable(),
  raiseGoal: z.coerce.number().nonnegative().default(0),
  raisedAmount: z.coerce.number().nonnegative().default(0),
  raisedAmountUndisclosed: z.boolean().default(false),
  minimumInvestment: z.coerce.number().nonnegative().default(0),
  companyOverview: z.string().default(""),
  closeDate: z.string().optional().nullable(),
  marketOpportunityNarrative: z.string().optional().nullable(),
  sidebarFields: z.array(labelValueSchema).default([]),
  snapshotFields: z.array(labelValueSchema).default([]),
  whyInvestBullets: z.array(bulletSchema).default([]),
  marketStats: z.array(labelValueSchema).default([]),
  leadership: z.array(leadershipSchema).default([]),
  faqs: z.array(faqSchema).default([]),
});

export type DealInput = z.infer<typeof dealInputSchema>;

export const siteSettingsInputSchema = z.object({
  capitalRaised: z.string().default("$0"),
  completedTransactions: z.string().default("0"),
  activeDeals: z.string().default("0"),
  investorNetwork: z.string().default("0"),
  teamSectionTitle: z.string().trim().min(1).max(160).default("Meet the Investment Relations Team"),
  teamSectionSubtitle: z.string().trim().max(300).default(""),
  featuredDealId: z.string().optional().nullable(),
  featuredClosedDealIds: z.array(z.string()).default([]),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;
