import { z } from "zod";

// ---------------------------------------------------------------------------
// The investor verification form's editable configuration — shape,
// validation, and the seed matching today's hardcoded form. This file is
// importable from client components; the server-side persistence lives in
// ./formConfig.ts.
//
// apps/web keeps a structural copy of these types (lib/verification/
// formConfig.ts) — the two apps deliberately don't share packages.
// ---------------------------------------------------------------------------

export const FIELD_TYPES = ["SHORT_TEXT", "DROPDOWN", "YES_NO", "DATE"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  SHORT_TEXT: "Short text",
  DROPDOWN: "Dropdown",
  YES_NO: "Yes / No",
  DATE: "Date",
};

const formOptionSchema = z.object({
  value: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(120),
  hidden: z.boolean().optional(),
});

const formFieldSchema = z.object({
  key: z.string().trim().min(1).max(80),
  step: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  label: z.string().trim().min(1).max(160),
  helpText: z.string().trim().max(300).optional(),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
  core: z.boolean(),
  // DROPDOWN only. For optionsLocked fields (enum-backed columns) the
  // option *values* are fixed — labels and hidden flags stay editable.
  options: z.array(formOptionSchema).max(50).optional(),
  optionsLocked: z.boolean().optional(),
});

export const formConfigSchema = z.object({
  version: z.literal(1),
  fields: z.array(formFieldSchema).max(80),
  certificationText: z.string().trim().min(1).max(2000),
});

export type FormOption = z.infer<typeof formOptionSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type VerificationFormConfig = z.infer<typeof formConfigSchema>;

const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Singapore",
  "Other",
];

// Exactly today's hardcoded form, so seeding this feature changes nothing
// visually until an admin edits something.
export const DEFAULT_FORM_CONFIG: VerificationFormConfig = {
  version: 1,
  fields: [
    // --- Step 1: Contact Information ---
    { key: "contact.firstName", step: 1, label: "First Name", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.lastName", step: 1, label: "Last Name", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.email", step: 1, label: "Email Address", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.phone", step: 1, label: "Phone Number", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.dateOfBirth", step: 1, label: "Date of Birth", type: "DATE", required: true, core: true },
    { key: "contact.ssnLast4", step: 1, label: "SSN — Last 4 Digits", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.streetAddress", step: 1, label: "Street Address", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.city", step: 1, label: "City", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.state", step: 1, label: "State", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.zipCode", step: 1, label: "ZIP Code", type: "SHORT_TEXT", required: true, core: true },
    {
      key: "contact.investorType",
      step: 1,
      label: "Investor Type",
      type: "DROPDOWN",
      required: true,
      core: true,
      optionsLocked: true,
      options: [
        { value: "INDIVIDUAL", label: "Individual" },
        { value: "JOINT", label: "Joint Account" },
        { value: "ENTITY_TRUST", label: "Entity / Trust" },
      ],
    },
    // --- Step 2: KYC / AML ---
    {
      key: "kyc.countryOfCitizenship",
      step: 2,
      label: "Country of Citizenship",
      type: "DROPDOWN",
      required: true,
      core: true,
      options: COUNTRY_OPTIONS.map((c) => ({ value: c, label: c })),
    },
    {
      key: "kyc.taxResidence",
      step: 2,
      label: "Tax Residence",
      type: "DROPDOWN",
      required: true,
      core: true,
      options: COUNTRY_OPTIONS.map((c) => ({ value: c, label: c })),
    },
    {
      key: "kyc.sourceOfFunds",
      step: 2,
      label: "Source of Funds",
      type: "DROPDOWN",
      required: true,
      core: true,
      options: [
        { value: "Employment / Salary", label: "Employment / Salary" },
        { value: "Business Income", label: "Business Income" },
        { value: "Inheritance", label: "Inheritance" },
        { value: "Investment Income", label: "Investment Income" },
        { value: "Sale of Assets", label: "Sale of Assets" },
        { value: "Other", label: "Other" },
      ],
    },
    // --- Step 3: Accreditation ---
    {
      key: "accreditation.method",
      step: 3,
      label: "Qualification Method",
      type: "DROPDOWN",
      required: true,
      core: true,
      optionsLocked: true,
      options: [
        { value: "ANNUAL_INCOME", label: "Annual Income" },
        { value: "NET_WORTH", label: "Net Worth" },
        { value: "PROFESSIONAL_CERTIFICATION", label: "Professional Certification" },
        { value: "ENTITY_QUALIFICATION", label: "Entity Qualification" },
        { value: "KNOWLEDGEABLE_EMPLOYEE", label: "Knowledgeable Employee" },
      ],
    },
  ],
  certificationText:
    "I certify that the information provided is accurate and complete, that I am the person identified above, and that I qualify as an accredited investor under SEC Rule 501 of Regulation D on the basis selected.",
};

// Editor saves must keep every core field (identified by key) and, for
// optionsLocked dropdowns, every original option value.
export function validateDraftAgainstCore(draft: VerificationFormConfig): string | null {
  for (const coreField of DEFAULT_FORM_CONFIG.fields) {
    const submitted = draft.fields.find((f) => f.key === coreField.key);
    if (!submitted) return `Core field "${coreField.key}" is missing`;
    if (!submitted.core) return `Field "${coreField.key}" must stay core`;
    if (submitted.step !== coreField.step) return `Core field "${coreField.key}" can't change steps`;
    if (submitted.type !== coreField.type) return `Core field "${coreField.key}" can't change type`;
    if (!submitted.required) return `Core field "${coreField.key}" must stay required`;

    if (coreField.optionsLocked) {
      if (!submitted.optionsLocked) return `Options for "${coreField.key}" are locked`;
      const submittedValues = new Set((submitted.options ?? []).map((o) => o.value));
      for (const option of coreField.options ?? []) {
        if (!submittedValues.has(option.value)) {
          return `Option "${option.value}" of "${coreField.key}" can't be removed`;
        }
      }
    }

    if (coreField.type === "DROPDOWN" && !(submitted.options ?? []).some((o) => !o.hidden)) {
      return `"${coreField.key}" needs at least one visible option`;
    }
  }

  const keys = draft.fields.map((f) => f.key);
  if (new Set(keys).size !== keys.length) return "Field keys must be unique";

  for (const field of draft.fields) {
    const isKnownCore = DEFAULT_FORM_CONFIG.fields.some((c) => c.key === field.key);
    if (field.core && !isKnownCore) return `Unknown core field "${field.key}"`;
    if (!field.core && field.type === "DROPDOWN" && !(field.options ?? []).some((o) => !o.hidden)) {
      return `"${field.label}" needs at least one visible option`;
    }
  }

  return null;
}
