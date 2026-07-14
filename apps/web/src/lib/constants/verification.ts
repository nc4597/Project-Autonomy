// Mirrors apps/api/src/schemas/verificationSchemas.ts. Kept as a plain,
// dependency-free constants file (not imported across the package
// boundary) since the frontend and backend are deployed as separate
// services/repos-in-spirit; if this drifts from the backend, the
// backend's server-side validation is still the authoritative source of
// truth at submit time.

export const INVESTOR_TYPES = ["INDIVIDUAL", "JOINT", "ENTITY_TRUST"] as const;
export type InvestorType = (typeof INVESTOR_TYPES)[number];

export const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  INDIVIDUAL: "Individual",
  JOINT: "Joint Account",
  ENTITY_TRUST: "Entity / Trust",
};

export const SOURCE_OF_FUNDS = [
  "EMPLOYMENT_SALARY",
  "BUSINESS_INCOME",
  "INHERITANCE",
  "INVESTMENTS",
  "SALE_OF_ASSETS",
  "OTHER",
] as const;
export type SourceOfFunds = (typeof SOURCE_OF_FUNDS)[number];

export const SOURCE_OF_FUNDS_LABELS: Record<SourceOfFunds, string> = {
  EMPLOYMENT_SALARY: "Employment / Salary",
  BUSINESS_INCOME: "Business Income",
  INHERITANCE: "Inheritance",
  INVESTMENTS: "Investment Income",
  SALE_OF_ASSETS: "Sale of Assets",
  OTHER: "Other",
};

export const ACCREDITATION_METHODS = [
  "ANNUAL_INCOME",
  "NET_WORTH",
  "PROFESSIONAL_CERTIFICATION",
  "ENTITY_QUALIFICATION",
  "KNOWLEDGEABLE_EMPLOYEE",
] as const;
export type AccreditationMethod = (typeof ACCREDITATION_METHODS)[number];

export const ACCREDITATION_METHOD_DETAILS: Record<
  AccreditationMethod,
  { title: string; description: string }
> = {
  ANNUAL_INCOME: {
    title: "Annual Income",
    description: "$200K individual / $300K joint for past 2 years, expected to continue",
  },
  NET_WORTH: {
    title: "Net Worth",
    description: "Net worth exceeding $1M excluding primary residence, individually or jointly",
  },
  PROFESSIONAL_CERTIFICATION: {
    title: "Professional Certification",
    description: "FINRA Series 7, 65, or 82 license in good standing",
  },
  ENTITY_QUALIFICATION: {
    title: "Entity Qualification",
    description: "Entity with $5M+ in investments, or all beneficial owners are accredited",
  },
  KNOWLEDGEABLE_EMPLOYEE: {
    title: "Knowledgeable Employee",
    description: "Knowledgeable employee of a registered investment fund",
  },
};

export const DOCUMENT_CATEGORIES = [
  "ID_FRONT",
  "ID_BACK",
  "PROOF_OF_ADDRESS",
  "ENTITY_FORMATION_DOC",
  "INCOME_TAX_RETURN",
  "BROKERAGE_STATEMENT",
  "BANK_STATEMENT",
  "CPA_NET_WORTH_LETTER",
  "FINRA_CRD_OR_LICENSE",
  "ENTITY_FINANCIALS_OR_TAX_RETURNS",
  "CAP_TABLE",
  "EMPLOYMENT_VERIFICATION_OR_FUND_CERT",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_LABELS: Record<DocumentCategory, { title: string; helperText: string }> = {
  ID_FRONT: { title: "Front of ID", helperText: "Accepted: Passport, Driver's License, State ID" },
  ID_BACK: { title: "Back of ID", helperText: "Accepted: Passport, Driver's License, State ID" },
  PROOF_OF_ADDRESS: {
    title: "Utility Bill, Bank Statement, or Government Letter (within 90 days)",
    helperText: "",
  },
  ENTITY_FORMATION_DOC: {
    title: "Operating Agreement, Certificate of Formation, or Trust Agreement",
    helperText: "",
  },
  INCOME_TAX_RETURN: { title: "Tax Returns or W-2s (last 2 years)", helperText: "" },
  BROKERAGE_STATEMENT: {
    title: "Brokerage / Investment Account Statements (within 90 days)",
    helperText: "",
  },
  BANK_STATEMENT: { title: "Bank Account Statements (within 90 days)", helperText: "" },
  CPA_NET_WORTH_LETTER: { title: "CPA Letter confirming net worth (optional)", helperText: "" },
  FINRA_CRD_OR_LICENSE: {
    title: "FINRA CRD Record or License Certificate (Series 7, 65, or 82)",
    helperText: "",
  },
  ENTITY_FINANCIALS_OR_TAX_RETURNS: { title: "Entity Financial Statements or Tax Returns", helperText: "" },
  CAP_TABLE: { title: "Capitalization Table or Ownership Structure", helperText: "" },
  EMPLOYMENT_VERIFICATION_OR_FUND_CERT: {
    title: "Employment Verification Letter or Qualified Fund Certification",
    helperText: "",
  },
};

export const ALLOWED_UPLOAD_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_SIZE_LABEL = "25MB";
export const ACCEPTED_UPLOAD_LABEL = "PDF, JPG, or PNG";

export const KYC_REQUIRED_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "ID_FRONT",
  "ID_BACK",
  "PROOF_OF_ADDRESS",
];

// Method -> the supporting-document categories to render in step 3.
// Adding/adjusting a qualification method's requirements is a data
// change here, not a new component. The backend enforces the same
// mapping independently at submit time (see
// apps/api/src/schemas/verificationSchemas.ts).
export const SUPPORTING_DOC_REQUIREMENTS: Record<
  AccreditationMethod,
  { category: DocumentCategory; required: boolean }[]
> = {
  ANNUAL_INCOME: [{ category: "INCOME_TAX_RETURN", required: true }],
  NET_WORTH: [
    { category: "BROKERAGE_STATEMENT", required: true },
    { category: "BANK_STATEMENT", required: true },
    { category: "CPA_NET_WORTH_LETTER", required: false },
  ],
  PROFESSIONAL_CERTIFICATION: [{ category: "FINRA_CRD_OR_LICENSE", required: true }],
  ENTITY_QUALIFICATION: [
    { category: "ENTITY_FINANCIALS_OR_TAX_RETURNS", required: true },
    { category: "CAP_TABLE", required: true },
  ],
  KNOWLEDGEABLE_EMPLOYEE: [{ category: "EMPLOYMENT_VERIFICATION_OR_FUND_CERT", required: true }],
};

export const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Singapore",
  "Other",
];

export const WIZARD_STEPS = [
  { step: 1, label: "Contact Information" },
  { step: 2, label: "KYC / AML" },
  { step: 3, label: "Accredited Investor" },
  { step: 4, label: "Review & Submit" },
] as const;
