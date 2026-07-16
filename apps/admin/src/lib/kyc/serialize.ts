import type { Prisma } from ".prisma/kyc-client";

export const SUBMISSION_INCLUDE = {
  contactInfo: true,
  kycAmlInfo: true,
  accreditation: true,
  certification: true,
  documents: true,
  hubspotSync: true,
} as const;

export type SubmissionWithRelations = Prisma.VerificationSubmissionGetPayload<{
  include: typeof SUBMISSION_INCLUDE;
}>;

/** Investor-facing shape — used by the wizard itself (GET /verifications/:id). */
export function serializeSubmission(submission: SubmissionWithRelations) {
  return {
    id: submission.id,
    dealId: submission.dealId,
    status: submission.status,
    currentStep: submission.currentStep,
    contactInfo: submission.contactInfo
      ? {
          ...submission.contactInfo,
          dateOfBirth: submission.contactInfo.dateOfBirth.toISOString().slice(0, 10),
        }
      : null,
    kycAmlInfo: submission.kycAmlInfo,
    accreditation: submission.accreditation,
    certification: submission.certification,
    documents: submission.documents.map((doc) => ({
      id: doc.id,
      category: doc.category,
      originalFilename: doc.originalFilename,
      status: doc.status,
      createdAt: doc.createdAt,
    })),
    hubspotSyncStatus: submission.hubspotSync?.status ?? "NOT_CONFIGURED",
  };
}
