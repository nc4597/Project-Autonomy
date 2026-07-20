import type { Prisma } from ".prisma/kyc-client";
import {
  ACCREDITATION_DOCUMENT_REQUIREMENTS,
  ACCREDITATION_METHODS_BY_INVESTOR_TYPE,
  kycRequiredDocumentCategories,
  type AccreditationMethod,
  type InvestorType,
} from "./schemas";
import type { VerificationFormConfig } from "./formConfigShared";

export type SubmissionWithRelations = Prisma.VerificationSubmissionGetPayload<{
  include: {
    contactInfo: true;
    kycAmlInfo: true;
    accreditation: true;
    certification: true;
    documents: true;
    customAnswers: true;
  };
}>;

export interface SubmissionCompletenessError {
  field: string;
  message: string;
}

/**
 * Re-validates that a submission is actually complete before allowing it
 * to be marked SUBMITTED. Mirrors the frontend's step gating, but this is
 * the copy that actually matters: a client that skips steps or forges
 * state cannot force a submission through without the real required
 * documents.
 */
export function validateSubmissionCompleteness(
  submission: SubmissionWithRelations,
  // When the published form config is provided, required admin-defined
  // custom fields (on core steps and custom pages alike) must be
  // answered — the server-side twin of the wizard's own gating.
  config?: VerificationFormConfig | null
): SubmissionCompletenessError[] {
  const errors: SubmissionCompletenessError[] = [];

  if (config) {
    const answered = new Set(
      submission.customAnswers.filter((a) => a.value.trim().length > 0).map((a) => a.fieldKey)
    );
    for (const field of config.fields) {
      if (field.core || !field.required) continue;
      // A dropdown with every option hidden isn't renderable — don't
      // require what the investor can't answer.
      if (field.type === "DROPDOWN" && !(field.options ?? []).some((o) => !o.hidden)) continue;
      if (!answered.has(field.key)) {
        errors.push({ field: `custom.${field.key}`, message: `${field.label} is required` });
      }
    }
  }

  if (!submission.contactInfo) {
    errors.push({ field: "contactInfo", message: "Contact information is required" });
  }
  if (!submission.kycAmlInfo) {
    errors.push({ field: "kycAmlInfo", message: "KYC/AML information is required" });
  }
  if (!submission.accreditation) {
    errors.push({ field: "accreditation", message: "Accreditation method is required" });
  }
  if (!submission.certification) {
    errors.push({ field: "certification", message: "Certification must be accepted" });
  }

  const uploadedCategories = new Set(
    submission.documents.filter((doc) => doc.status === "UPLOADED").map((doc) => doc.category)
  );

  // Joint accounts additionally require the co-owner's ID (see the helper).
  const investorType = submission.contactInfo?.investorType ?? "INDIVIDUAL";
  for (const category of kycRequiredDocumentCategories(investorType)) {
    if (!uploadedCategories.has(category)) {
      errors.push({ field: `documents.${category}`, message: `${category} must be uploaded` });
    }
  }

  if (submission.accreditation) {
    const method = submission.accreditation.method as AccreditationMethod;
    const requirements = ACCREDITATION_DOCUMENT_REQUIREMENTS[method];
    for (const requirement of requirements) {
      if (requirement.required && !uploadedCategories.has(requirement.category)) {
        errors.push({
          field: `documents.${requirement.category}`,
          message: `${requirement.category} must be uploaded for the selected accreditation method`,
        });
      }
    }

    // The chosen method must fit the investor type (individuals/joint
    // qualify personally; entities on the entity test) — the server-side
    // twin of Step 3's filtered method list.
    if (submission.contactInfo) {
      const allowed = ACCREDITATION_METHODS_BY_INVESTOR_TYPE[
        submission.contactInfo.investorType as InvestorType
      ];
      if (allowed && !allowed.includes(method)) {
        errors.push({
          field: "accreditation.method",
          message: "Selected accreditation method does not apply to this investor type",
        });
      }
    }
  }

  return errors;
}
