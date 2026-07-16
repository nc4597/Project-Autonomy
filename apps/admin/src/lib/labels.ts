export const SECTOR_LABELS: Record<string, string> = {
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
};

export const OFFERING_TYPE_LABELS: Record<string, string> = {
  REG_D_506C: "Reg D 506(c)",
  REG_A: "Reg A",
  LP_PLACEMENT: "LP Placement",
  VENTURE: "Venture",
  FUND: "Fund",
};

// KYC/AML labels — these enum values come from the KYC Prisma schema
// (prisma/kyc/schema.prisma, a separate database), not from this app's
// own default Prisma schema.
export const KYC_INVESTOR_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: "Individual",
  JOINT: "Joint Account",
  ENTITY_TRUST: "Entity / Trust",
};

export const KYC_ACCREDITATION_METHOD_LABELS: Record<string, string> = {
  ANNUAL_INCOME: "Annual Income",
  NET_WORTH: "Net Worth",
  PROFESSIONAL_CERTIFICATION: "Professional Certification",
  ENTITY_QUALIFICATION: "Entity Qualification",
  KNOWLEDGEABLE_EMPLOYEE: "Knowledgeable Employee",
};

export const KYC_SOURCE_OF_FUNDS_LABELS: Record<string, string> = {
  EMPLOYMENT_SALARY: "Employment / Salary",
  BUSINESS_INCOME: "Business Income",
  INHERITANCE: "Inheritance",
  INVESTMENTS: "Investment Income",
  SALE_OF_ASSETS: "Sale of Assets",
  OTHER: "Other",
};

export const KYC_DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  ID_FRONT: "Front of ID",
  ID_BACK: "Back of ID",
  PROOF_OF_ADDRESS: "Proof of Address",
  ENTITY_FORMATION_DOC: "Entity Formation Document",
  INCOME_TAX_RETURN: "Tax Returns / W-2s",
  BROKERAGE_STATEMENT: "Brokerage Statement",
  BANK_STATEMENT: "Bank Statement",
  CPA_NET_WORTH_LETTER: "CPA Net Worth Letter",
  FINRA_CRD_OR_LICENSE: "FINRA CRD Record / License",
  ENTITY_FINANCIALS_OR_TAX_RETURNS: "Entity Financials / Tax Returns",
  CAP_TABLE: "Capitalization Table",
  EMPLOYMENT_VERIFICATION_OR_FUND_CERT: "Employment Verification / Fund Certification",
};

export const KYC_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
};
