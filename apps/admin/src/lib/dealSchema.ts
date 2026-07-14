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
] as const;

export const OFFERING_TYPES = [
  "REG_D_506C",
  "REG_A",
  "LP_PLACEMENT",
  "VENTURE",
  "FUND",
] as const;

const labelValueSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  value: z.string().min(1),
});

const bulletSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
});

const leadershipSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  title: z.string().min(1),
  bio: z.string().min(1),
  photoUrl: z.string().optional().nullable(),
});

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const dealInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  status: z.enum(["LIVE", "CLOSED"]),
  name: z.string().min(1),
  subheader: z.string().min(1),
  sector: z.enum(SECTORS),
  offeringType: z.enum(OFFERING_TYPES),
  logoUrl: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  bannerImageUrl: z.string().optional().nullable(),
  raiseGoal: z.coerce.number().positive(),
  raisedAmount: z.coerce.number().nonnegative(),
  minimumInvestment: z.coerce.number().positive(),
  companyOverview: z.string().min(1),
  closeDate: z.string().optional().nullable(),
  investmentVehicle: z.string().optional().nullable(),
  regulation: z.string().optional().nullable(),
  marketOpportunityNarrative: z.string().optional().nullable(),
  snapshotFields: z.array(labelValueSchema).default([]),
  whyInvestBullets: z.array(bulletSchema).default([]),
  marketStats: z.array(labelValueSchema).default([]),
  leadership: z.array(leadershipSchema).default([]),
  faqs: z.array(faqSchema).default([]),
});

export type DealInput = z.infer<typeof dealInputSchema>;

export const siteSettingsInputSchema = z.object({
  capitalRaised: z.string().min(1),
  completedTransactions: z.string().min(1),
  activeDeals: z.string().min(1),
  investorNetwork: z.string().min(1),
  featuredDealId: z.string().optional().nullable(),
  featuredClosedDealIds: z.array(z.string()).default([]),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsInputSchema>;
