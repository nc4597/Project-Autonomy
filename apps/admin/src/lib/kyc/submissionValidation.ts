import type { Prisma } from ".prisma/kyc-client";
import {
  ACCREDITATION_DOCUMENT_REQUIREMENTS,
  KYC_REQUIRED_DOCUMENT_CATEGORIES,
  type AccreditationMethod,
} from "./schemas";

export type SubmissionWithRelations = Prisma.VerificationSubmissionGetPayload<{
  include: {
    contactInfo: true;
    kycAmlInfo: true;
    accreditation: true;
    certification: true;
    documents: true;
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
  submission: SubmissionWithRelations
): SubmissionCompletenessError[] {
  const errors: SubmissionCompletenessError[] = [];

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

  for (const category of KYC_REQUIRED_DOCUMENT_CATEGORIES) {
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
  }

  return errors;
}
