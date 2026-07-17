// Structural copy of apps/admin/src/lib/kyc/formConfigShared.ts (the two
// apps deliberately don't share packages). The admin's published config
// drives what the verification wizard renders: labels, help text,
// dropdown options, and admin-defined custom fields.

import {
  ACCREDITATION_METHODS,
  ACCREDITATION_METHOD_DETAILS,
  COUNTRY_OPTIONS,
  INVESTOR_TYPES,
  INVESTOR_TYPE_LABELS,
  SOURCE_OF_FUNDS,
  SOURCE_OF_FUNDS_LABELS,
} from "../constants/verification";

export type FieldType = "SHORT_TEXT" | "DROPDOWN" | "YES_NO" | "DATE";

export interface FormOption {
  value: string;
  label: string;
  hidden?: boolean;
}

export interface FormField {
  key: string;
  // 1-3 are the core steps; a string is a custom page's key.
  step: 1 | 2 | 3 | string;
  label: string;
  helpText?: string;
  type: FieldType;
  required: boolean;
  core: boolean;
  options?: FormOption[];
  optionsLocked?: boolean;
}

/**
 * Admin-defined wizard page. afterStep says which core step it follows
 * (1 = after Contact Info, 2 = after KYC/AML, 3 = after Accreditation —
 * also the meaning when absent, for pages saved before it existed).
 */
export interface CustomPage {
  key: string;
  title: string;
  description?: string;
  afterStep?: 1 | 2 | 3;
}

export interface VerificationFormConfig {
  version: 1;
  fields: FormField[];
  customPages: CustomPage[];
  certificationText: string;
}

export function fieldFor(config: VerificationFormConfig, key: string): FormField | undefined {
  return config.fields.find((f) => f.key === key);
}

export function labelFor(config: VerificationFormConfig, key: string, fallback: string): string {
  return fieldFor(config, key)?.label ?? fallback;
}

export function helpFor(config: VerificationFormConfig, key: string): string | undefined {
  return fieldFor(config, key)?.helpText;
}

export function visibleOptions(field: FormField | undefined): FormOption[] {
  return (field?.options ?? []).filter((o) => !o.hidden);
}

export function customFieldsForStep(
  config: VerificationFormConfig,
  step: 1 | 2 | 3 | string
): FormField[] {
  return config.fields.filter((f) => !f.core && f.step === step);
}

// Rendered until (or in case) the published config can't be fetched —
// mirrors the hardcoded form this feature replaced.
export function buildFallbackFormConfig(): VerificationFormConfig {
  const countryOptions = COUNTRY_OPTIONS.map((c) => ({ value: c, label: c }));
  return {
    version: 1,
    customPages: [],
    fields: [
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
        options: INVESTOR_TYPES.map((t) => ({ value: t, label: INVESTOR_TYPE_LABELS[t] })),
      },
      {
        key: "kyc.countryOfCitizenship",
        step: 2,
        label: "Country of Citizenship",
        type: "DROPDOWN",
        required: true,
        core: true,
        options: countryOptions,
      },
      {
        key: "kyc.taxResidence",
        step: 2,
        label: "Tax Residence",
        type: "DROPDOWN",
        required: true,
        core: true,
        options: countryOptions,
      },
      {
        key: "kyc.sourceOfFunds",
        step: 2,
        label: "Source of Funds",
        type: "DROPDOWN",
        required: true,
        core: true,
        options: SOURCE_OF_FUNDS.map((s) => ({
          value: SOURCE_OF_FUNDS_LABELS[s],
          label: SOURCE_OF_FUNDS_LABELS[s],
        })),
      },
      {
        key: "accreditation.method",
        step: 3,
        label: "Qualification Method",
        type: "DROPDOWN",
        required: true,
        core: true,
        optionsLocked: true,
        options: ACCREDITATION_METHODS.map((m) => ({
          value: m,
          label: ACCREDITATION_METHOD_DETAILS[m].title,
        })),
      },
    ],
    certificationText:
      "I certify that the information provided is accurate and complete, that I am the person identified above, and that I qualify as an accredited investor under SEC Rule 501 of Regulation D on the basis selected.",
  };
}

// ---------------------------------------------------------------------------
// Wizard sequence — structural copy of the admin's helpers: core steps
// with admin pages interleaved wherever they were moved, Review last.
// `number` is the 1-based step number investors see.
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
  for (const coreStep of [1, 2, 3] as const) {
    entries.push({ kind: "core", coreStep });
    for (const page of config.customPages.filter((p) => (p.afterStep ?? 3) === coreStep)) {
      entries.push({ kind: "page", page });
    }
  }
  entries.push({ kind: "review" });
  return entries.map((entry, index) => ({ ...entry, number: index + 1 }));
}

export function numberForCore(config: VerificationFormConfig, coreStep: 1 | 2 | 3): number {
  const entry = buildWizardSequence(config).find((e) => e.kind === "core" && e.coreStep === coreStep);
  return entry?.number ?? coreStep;
}

export function numberForPage(config: VerificationFormConfig, pageKey: string): number | null {
  const entry = buildWizardSequence(config).find((e) => e.kind === "page" && e.page.key === pageKey);
  return entry?.number ?? null;
}
