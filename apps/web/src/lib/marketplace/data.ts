import type { Deal, FaqItem, Kpi } from "./types";

/**
 * Placeholder content standing in for the future CMS-backed data source.
 * Shape mirrors what a `/api/deals` and `/api/site-settings` endpoint
 * would eventually return once the custom backend exists.
 */

export const kpis: Kpi[] = [
  { value: "$284M+", label: "Capital Raised" },
  { value: "47", label: "Completed Transactions" },
  { value: "5", label: "Active Deals" },
  { value: "1,200+", label: "Investor Network" },
];

export const deals: Deal[] = [
  {
    slug: "novatech-ai",
    name: "NovaTech AI",
    initials: "NT",
    tagline: "Enterprise AI Infrastructure",
    summary:
      "NovaTech AI has built the premier large language model deployment platform for regulated industries — banking, healthcare, insurance, and legal. With over 140 enterprise clients and $28M in ARR, the company is scaling rapidly through direct enterprise sales and channel partnerships.",
    sector: "AI",
    dealType: "Reg D 506(c)",
    status: "live",
    raised: 8_200_000,
    goal: 12_000_000,
    minInvestment: 50_000,
  },
  {
    slug: "meridian-health-systems",
    name: "Meridian Health Systems",
    initials: "MH",
    tagline: "Value-Based Healthcare Delivery",
    summary:
      "12-site ambulatory surgery center network generating $60M revenue across Georgia, Florida, and Tennessee.",
    sector: "Healthcare",
    dealType: "Reg D 506(c)",
    status: "live",
    raised: 4_500_000,
    goal: 8_000_000,
    minInvestment: 100_000,
  },
  {
    slug: "apex-energy-partners-iii",
    name: "Apex Energy Partners III",
    initials: "AE",
    tagline: "Midstream Infrastructure Fund",
    summary:
      "Closed-end fund targeting Permian Basin midstream assets with an 8% preferred return and 21.4% realized track record.",
    sector: "Energy",
    dealType: "LP Placement",
    status: "live",
    raised: 15_000_000,
    goal: 20_000_000,
    minInvestment: 250_000,
  },
  {
    slug: "finoso-capital",
    name: "Finoso Capital",
    initials: "FC",
    tagline: "Embedded Lending Infrastructure",
    summary:
      "API-first lending infrastructure powering embedded credit products for over 60 fintech and marketplace platforms.",
    sector: "FinTech",
    dealType: "Reg A",
    status: "live",
    raised: 3_100_000,
    goal: 10_000_000,
    minInvestment: 25_000,
  },
  {
    slug: "verita-biosciences",
    name: "Verita Biosciences",
    initials: "VB",
    tagline: "Precision Diagnostics Platform",
    summary:
      "Clinical-stage diagnostics company developing rapid molecular assays for early cancer detection.",
    sector: "Healthcare",
    dealType: "Venture",
    status: "live",
    raised: 6_400_000,
    goal: 15_000_000,
    minInvestment: 50_000,
  },
  {
    slug: "cascade-industrial-partners",
    name: "Cascade Industrial Partners",
    initials: "CI",
    tagline: "Senior Secured Private Credit",
    summary:
      "Senior secured private credit fund providing direct lending to lower middle-market industrial companies.",
    sector: "Infrastructure",
    dealType: "LP Placement",
    status: "closed",
    raised: 25_000_000,
    goal: 25_000_000,
    minInvestment: 100_000,
    closeDate: "March 2024",
  },
  {
    slug: "anchor-real-estate-fund-iii",
    name: "Anchor Real Estate Fund III",
    initials: "AR",
    tagline: "Value-Add Multifamily Portfolio",
    summary:
      "Value-add multifamily acquisition fund targeting Sun Belt growth markets.",
    sector: "Real Estate",
    dealType: "LP Placement",
    status: "closed",
    raised: 40_000_000,
    goal: 40_000_000,
    minInvestment: 100_000,
    closeDate: "November 2023",
  },
  {
    slug: "precisionmed-therapeutics",
    name: "PrecisionMed Therapeutics",
    initials: "PM",
    tagline: "Targeted Gene Therapy Platform",
    summary:
      "Clinical-stage biotechnology company developing targeted gene therapies for rare genetic disorders.",
    sector: "Healthcare",
    dealType: "Reg D 506(c)",
    status: "closed",
    raised: 12_000_000,
    goal: 12_000_000,
    minInvestment: 50_000,
    closeDate: "June 2024",
  },
];

export const featuredDealSlug = "novatech-ai";

export const featuredClosedDealSlugs = [
  "cascade-industrial-partners",
  "anchor-real-estate-fund-iii",
  "precisionmed-therapeutics",
];

export const homeFaqs: FaqItem[] = [
  {
    question: "Who can invest through Regiment Marketplace?",
    answer:
      "Regiment Marketplace is available exclusively to accredited investors as defined by the SEC. You'll complete a verification process to confirm accredited status before accessing full deal materials or investing in any offering.",
  },
  {
    question: "What types of offerings are available?",
    answer:
      "Offerings include Reg D 506(c) private placements, Reg A offerings, LP placements, venture investments, and fund vehicles across sectors such as AI, healthcare, energy, fintech, defense, infrastructure, and real estate.",
  },
  {
    question: "What is the minimum investment?",
    answer:
      "Minimum investments vary by offering, typically ranging from $25,000 to $250,000. Each deal's specific minimum is listed on its overview page.",
  },
  {
    question: "How does the verification process work?",
    answer:
      "After expressing interest in a deal, you'll complete a secure multi-step verification covering contact information, identity (KYC/AML), and accredited investor status. Our compliance team typically completes review within 1-2 business days.",
  },
  {
    question: "Is Regiment Securities a registered broker-dealer?",
    answer:
      "Yes. Regiment Securities LLC is a registered broker-dealer and member of FINRA/SIPC. All offerings on the marketplace are reviewed for regulatory compliance before listing.",
  },
  {
    question: "What happens after I express interest in a deal?",
    answer:
      "Once your verification is approved, a dedicated Regiment Securities representative will contact you directly to guide you through deal documents, the data room, and funding.",
  },
];
