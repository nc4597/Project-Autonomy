import { z } from "zod";

export const INVESTOR_TYPES = ["INDIVIDUAL", "JOINT", "ENTITY_TRUST"] as const;
export const SOURCE_OF_FUNDS = [
  "EMPLOYMENT_SALARY",
  "BUSINESS_INCOME",
  "INHERITANCE",
  "INVESTMENTS",
  "SALE_OF_ASSETS",
  "OTHER",
] as const;
export const ACCREDITATION_METHODS = [
  "ANNUAL_INCOME",
  "NET_WORTH",
  "PROFESSIONAL_CERTIFICATION",
  "ENTITY_QUALIFICATION",
  "KNOWLEDGEABLE_EMPLOYEE",
] as const;
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
export type AccreditationMethod = (typeof ACCREDITATION_METHODS)[number];

export const ALLOWED_UPLOAD_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024; // 25MB, matches the dropzone copy

// Which document categories are required (vs. optional) for KYC/AML
// itself, independent of the chosen accreditation method.
export const KYC_REQUIRED_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "ID_FRONT",
  "ID_BACK",
  "PROOF_OF_ADDRESS",
];

// Server-side mirror of the frontend's SUPPORTING_DOC_REQUIREMENTS map.
// Authoritative here — a modified/bypassed client can never force a
// submission through without the real evidence.
export const ACCREDITATION_DOCUMENT_REQUIREMENTS: Record<
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

export const createSubmissionSchema = z.object({
  dealId: z.string().min(1).max(200),
});

const usStateOrRegion = z.string().trim().min(2).max(56);

export const TAX_ID_TYPES = ["SSN", "TIN"] as const;
export type TaxIdType = (typeof TAX_ID_TYPES)[number];

const last4 = (label: string) => z.string().regex(/^\d{4}$/, `${label} must be exactly 4 digits`);
const dobString = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be YYYY-MM-DD`)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), `${label} must be a valid date`);

// Kept as a plain (non-refined) object, separate from the refined
// contactInfoSchema below, so callers that need to .extend() it (the
// contact-info route adds customAnswers) still can — ZodEffects (what
// .superRefine() returns) doesn't support .extend().
export const contactInfoBaseSchema = z.object({
    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().min(1).max(120),
    email: z.string().trim().email().max(254),
    phone: z
      .string()
      .trim()
      .min(7)
      .max(20)
      .regex(/^[0-9+()\-.\s]+$/, "Phone number contains invalid characters"),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "dateOfBirth must be YYYY-MM-DD")
      .refine((value) => {
        const dob = new Date(value);
        if (Number.isNaN(dob.getTime())) return false;
        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
        return dob <= eighteenYearsAgo;
      }, "Investor must be at least 18 years old"),
    // Only ever the last 4 digits are accepted/stored — never a full
    // SSN/TIN, even if a client sends one. See the extra runtime guard
    // in the route handler too.
    taxIdType: z.enum(TAX_ID_TYPES),
    taxIdLast4: last4("taxIdLast4"),
    streetAddress: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(100),
    state: usStateOrRegion,
    zipCode: z.string().trim().min(3).max(12),
    investorType: z.enum(INVESTOR_TYPES),
    // Entity / Trust — required only when investorType = ENTITY_TRUST.
    entityName: z.string().trim().max(200).optional(),
    entityTaxIdLast4: last4("entityTaxIdLast4").optional(),
    // Joint Account co-owner — required only when investorType = JOINT.
    coOwnerFirstName: z.string().trim().max(120).optional(),
    coOwnerLastName: z.string().trim().max(120).optional(),
    coOwnerEmail: z.string().trim().email().max(254).optional(),
    coOwnerDateOfBirth: dobString("coOwnerDateOfBirth").optional(),
    coOwnerTaxIdType: z.enum(TAX_ID_TYPES).optional(),
    coOwnerTaxIdLast4: last4("coOwnerTaxIdLast4").optional(),
});

// Shared between contactInfoSchema and the contact-info route's extended
// (with customAnswers) variant, so both enforce the same conditional
// requirements without duplicating the checks.
export function refineContactInfo(
  data: z.infer<typeof contactInfoBaseSchema>,
  ctx: z.RefinementCtx
) {
  if (data.investorType === "ENTITY_TRUST") {
    if (!data.entityName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["entityName"], message: "Entity or trust name is required" });
    }
    if (!data.entityTaxIdLast4) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["entityTaxIdLast4"], message: "Entity EIN is required" });
    }
  }
  if (data.investorType === "JOINT") {
    if (!data.coOwnerFirstName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerFirstName"], message: "Co-owner first name is required" });
    }
    if (!data.coOwnerLastName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerLastName"], message: "Co-owner last name is required" });
    }
    if (!data.coOwnerEmail?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerEmail"], message: "Co-owner email is required" });
    }
    if (!data.coOwnerDateOfBirth) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerDateOfBirth"], message: "Co-owner date of birth is required" });
    }
    if (!data.coOwnerTaxIdType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerTaxIdType"], message: "Co-owner tax ID type is required" });
    }
    if (!data.coOwnerTaxIdLast4) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["coOwnerTaxIdLast4"], message: "Co-owner tax ID is required" });
    }
  }
}

export const contactInfoSchema = contactInfoBaseSchema.superRefine(refineContactInfo);
export type ContactInfoInput = z.infer<typeof contactInfoSchema>;

export const kycAmlInfoSchema = z.object({
  countryOfCitizenship: z.string().trim().min(1).max(100),
  taxResidence: z.string().trim().min(1).max(100),
  // Free text (the selected option's display label): the option list is
  // admin-configurable via the Verification Form editor.
  sourceOfFunds: z.string().trim().min(1).max(120),
});
export type KycAmlInfoInput = z.infer<typeof kycAmlInfoSchema>;

// Answers to admin-defined custom form fields, sent alongside each
// step's PATCH as { fieldKey: displayValue }. Keys are validated against
// the published form config at write time (see upsertCustomAnswers).
export const customAnswersSchema = z.record(z.string().max(500)).optional();

export const accreditationInfoSchema = z.object({
  method: z.enum(ACCREDITATION_METHODS),
});
export type AccreditationInfoInput = z.infer<typeof accreditationInfoSchema>;

export const presignDocumentSchema = z.object({
  category: z.enum(DOCUMENT_CATEGORIES),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_UPLOAD_SIZE_BYTES),
});
export type PresignDocumentInput = z.infer<typeof presignDocumentSchema>;

export const certificationSchema = z.object({
  accepted: z.literal(true),
  tosVersion: z.string().trim().min(1).max(40),
});
export type CertificationInput = z.infer<typeof certificationSchema>;
