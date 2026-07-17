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

/** Admin-defined wizard page, rendered between Accreditation and Review. */
export interface CustomPage {
  key: string;
  title: string;
  description?: string;
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
