export type Sector =
  | "AI"
  | "Healthcare"
  | "Energy"
  | "Crypto"
  | "FinTech"
  | "Defense"
  | "Infrastructure"
  | "Real Estate"
  | "EdTech"
  | "Private Equity"
  | "Financial Services/Asset Management"
  | "Telecommunications"
  | "Other";

export type DealType =
  | "Reg D 506(c)"
  | "Reg A"
  | "LP Placement"
  | "Venture"
  | "Fund"
  | "Direct Investment"
  | "Direct Placement";

export type DealStatus = "live" | "closed";

export interface Deal {
  slug: string;
  name: string;
  initials: string;
  logoUrl?: string | null;
  thumbnailUrl?: string | null;
  tagline: string;
  summary: string;
  sector: Sector;
  dealType: DealType;
  status: DealStatus;
  raised: number;
  goal: number;
  minInvestment: number;
  closeDate?: string;
}

export interface Kpi {
  value: string;
  label: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}
