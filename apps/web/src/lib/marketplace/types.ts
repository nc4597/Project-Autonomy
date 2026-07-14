export type Sector =
  | "AI"
  | "Healthcare"
  | "Energy"
  | "Crypto"
  | "FinTech"
  | "Defense"
  | "Infrastructure"
  | "Real Estate";

export type DealType =
  | "Reg D 506(c)"
  | "Reg A"
  | "LP Placement"
  | "Venture"
  | "Fund";

export type DealStatus = "live" | "closed";

export interface Deal {
  slug: string;
  name: string;
  initials: string;
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
