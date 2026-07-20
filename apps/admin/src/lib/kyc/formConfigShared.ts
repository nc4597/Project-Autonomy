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

// Admin-defined wizard pages. afterStep says which core step the page
// follows (0 = before Contact Info — i.e. the wizard's first page,
// 1 = after Contact Info, 2 = after KYC/AML, 3 = after Accreditation —
// the default, and what pages created before this field existed mean);
// array order is the order within that slot. A field whose `step` is a
// page's key lives on that page.
const customPageSchema = z.object({
  key: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300).optional(),
  afterStep: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(3),
});

const formFieldSchema = z.object({
  key: z.string().trim().min(1).max(80),
  // 1-3 are the core steps; a string is a custom page's key.
  step: z.union([z.literal(1), z.literal(2), z.literal(3), z.string().min(1).max(80)]),
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
  // default([]) upgrades configs stored before custom pages existed.
  customPages: z.array(customPageSchema).max(20).default([]),
  certificationText: z.string().trim().min(1).max(2000),
});

export type FormOption = z.infer<typeof formOptionSchema>;
export type FormField = z.infer<typeof formFieldSchema>;
export type CustomPage = z.infer<typeof customPageSchema>;
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
  customPages: [],
  fields: [
    // --- Step 1: Contact Information ---
    { key: "contact.firstName", step: 1, label: "First Name", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.lastName", step: 1, label: "Last Name", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.email", step: 1, label: "Email Address", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.phone", step: 1, label: "Phone Number", type: "SHORT_TEXT", required: true, core: true },
    { key: "contact.dateOfBirth", step: 1, label: "Date of Birth", type: "DATE", required: true, core: true },
    { key: "contact.taxIdLast4", step: 1, label: "Tax ID — Last 4 Digits", type: "SHORT_TEXT", required: true, core: true },
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
    { key: "contact.entityName", step: 1, label: "Entity or Trust Legal Name", type: "SHORT_TEXT", required: false, core: true },
    { key: "contact.entityTaxIdLast4", step: 1, label: "EIN — Last 4 Digits", type: "SHORT_TEXT", required: false, core: true },
    { key: "contact.coOwnerFirstName", step: 1, label: "Co-Owner First Name", type: "SHORT_TEXT", required: false, core: true },
    { key: "contact.coOwnerLastName", step: 1, label: "Co-Owner Last Name", type: "SHORT_TEXT", required: false, core: true },
    { key: "contact.coOwnerEmail", step: 1, label: "Co-Owner Email Address", type: "SHORT_TEXT", required: false, core: true },
    { key: "contact.coOwnerDateOfBirth", step: 1, label: "Co-Owner Date of Birth", type: "DATE", required: false, core: true },
    { key: "contact.coOwnerTaxIdLast4", step: 1, label: "Co-Owner Tax ID — Last 4 Digits", type: "SHORT_TEXT", required: false, core: true },
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

  const pageKeys = draft.customPages.map((p) => p.key);
  if (new Set(pageKeys).size !== pageKeys.length) return "Page keys must be unique";

  for (const field of draft.fields) {
    const isKnownCore = DEFAULT_FORM_CONFIG.fields.some((c) => c.key === field.key);
    if (field.core && !isKnownCore) return `Unknown core field "${field.key}"`;
    if (typeof field.step === "string" && !pageKeys.includes(field.step)) {
      return `"${field.label}" belongs to a page that no longer exists`;
    }
    if (!field.core && field.type === "DROPDOWN" && !(field.options ?? []).some((o) => !o.hidden)) {
      return `"${field.label}" needs at least one visible option`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Wizard sequence — the single source of truth for what order the
// investor walks through: core steps with their pages interleaved,
// Review & Certification always last. `number` is the 1-based step
// number investors see; everything that advances, renders, or links to
// a step derives it from here.
// ---------------------------------------------------------------------------

export type WizardEntry =
  | { number: number; kind: "core"; coreStep: 1 | 2 | 3 }
  | { number: number; kind: "page"; page: CustomPage }
  | { number: number; kind: "review" };

type WizardEntryDraft =
  | { kind: "core"; coreStep: 1 | 2 | 3 }
  | { kind: "page"; page: CustomPage }
  | { kind: "review" };

export function buildWizardSequence(config: VerificationFormConfig): WizardEntry[] {
  const entries: WizardEntryDraft[] = [];
  const pagesInSlot = (slot: 0 | 1 | 2 | 3) =>
    config.customPages.filter((p) => (p.afterStep ?? 3) === slot);
  for (const page of pagesInSlot(0)) entries.push({ kind: "page", page });
  for (const coreStep of [1, 2, 3] as const) {
    entries.push({ kind: "core", coreStep });
    for (const page of pagesInSlot(coreStep)) entries.push({ kind: "page", page });
  }
  entries.push({ kind: "review" });
  return entries.map((entry, index) => ({ ...entry, number: index + 1 }));
}

/** The step number a core step's save should advance the draft to. */
export function stepNumberAfterCore(config: VerificationFormConfig, coreStep: 1 | 2 | 3): number {
  const sequence = buildWizardSequence(config);
  const entry = sequence.find((e) => e.kind === "core" && e.coreStep === coreStep);
  return Math.min((entry?.number ?? coreStep) + 1, sequence.length);
}

export function numberForCore(config: VerificationFormConfig, coreStep: 1 | 2 | 3): number {
  const entry = buildWizardSequence(config).find((e) => e.kind === "core" && e.coreStep === coreStep);
  return entry?.number ?? coreStep;
}

export function numberForPage(config: VerificationFormConfig, pageKey: string): number | null {
  const entry = buildWizardSequence(config).find((e) => e.kind === "page" && e.page.key === pageKey);
  return entry?.number ?? null;
}

/**
 * Moves a page one position through the wizard: within its slot first,
 * hopping across the neighboring core step when it hits the slot edge.
 * Returns a config whose customPages array is stored in sequence order
 * (the array order is what breaks ties within a slot).
 */
export function movePageInConfig(
  config: VerificationFormConfig,
  pageKey: string,
  direction: -1 | 1
): VerificationFormConfig {
  const ordered = ([0, 1, 2, 3] as const).flatMap((slot) =>
    config.customPages.filter((p) => (p.afterStep ?? 3) === slot).map((p) => ({ ...p, afterStep: slot }))
  );
  const index = ordered.findIndex((p) => p.key === pageKey);
  if (index === -1) return config;
  const page = ordered[index];
  const neighbor = ordered[index + direction];

  if (neighbor && neighbor.afterStep === page.afterStep) {
    [ordered[index], ordered[index + direction]] = [ordered[index + direction], ordered[index]];
  } else if (direction === -1 && page.afterStep > 0) {
    page.afterStep = (page.afterStep - 1) as 0 | 1 | 2 | 3;
    // Re-sort puts it at the end of the earlier slot, i.e. directly
    // before the core step it used to follow.
    ordered.sort((a, b) => a.afterStep - b.afterStep || 0);
  } else if (direction === 1 && page.afterStep < 3) {
    page.afterStep = (page.afterStep + 1) as 0 | 1 | 2 | 3;
    // Moving later should land it at the START of the next slot; pull
    // it out and reinsert before that slot's existing pages.
    const without = ordered.filter((p) => p.key !== pageKey);
    const insertAt = without.findIndex((p) => p.afterStep >= page.afterStep);
    without.splice(insertAt === -1 ? without.length : insertAt, 0, page);
    return { ...config, customPages: without };
  } else {
    return config;
  }
  return { ...config, customPages: ordered };
}

export function canMovePage(
  config: VerificationFormConfig,
  pageKey: string,
  direction: -1 | 1
): boolean {
  return movePageInConfig(config, pageKey, direction) !== config;
}
