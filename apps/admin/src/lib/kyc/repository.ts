// Direct Prisma access to the KYC database for the admin review UI —
// same pattern as lib/dealRepository.ts for this app's own data. Unlike
// apps/web (a genuinely separate app/process), this admin UI and the
// KYC data now live in the same Next.js app, so there's no HTTP hop:
// Server Components here call these functions directly.
import { kycPrisma } from "./prisma";
import { SUBMISSION_INCLUDE, type SubmissionWithRelations } from "./serialize";

export interface KycSubmissionSummary {
  id: string;
  dealId: string;
  status: "DRAFT" | "SUBMITTED";
  createdAt: string;
  submittedAt: string | null;
  investorName: string | null;
  email: string | null;
  investorType: string | null;
  accreditationMethod: string | null;
  hubspotSyncStatus: string;
}

function summarize(submission: SubmissionWithRelations): KycSubmissionSummary {
  return {
    id: submission.id,
    dealId: submission.dealId,
    status: submission.status,
    createdAt: submission.createdAt.toISOString(),
    submittedAt: submission.submittedAt?.toISOString() ?? null,
    investorName: submission.contactInfo
      ? `${submission.contactInfo.firstName} ${submission.contactInfo.lastName}`
      : null,
    email: submission.contactInfo?.email ?? null,
    investorType: submission.contactInfo?.investorType ?? null,
    accreditationMethod: submission.accreditation?.method ?? null,
    hubspotSyncStatus: submission.hubspotSync?.status ?? "NOT_CONFIGURED",
  };
}

export async function listKycSubmissions(status?: "DRAFT" | "SUBMITTED"): Promise<KycSubmissionSummary[]> {
  const submissions = await kycPrisma.verificationSubmission.findMany({
    where: status ? { status } : undefined,
    include: SUBMISSION_INCLUDE,
    orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return submissions.map(summarize);
}

export async function getKycSubmissionDetail(id: string) {
  const submission = await kycPrisma.verificationSubmission.findUnique({
    where: { id },
    include: SUBMISSION_INCLUDE,
  });
  if (!submission) return null;

  // Internal compliance view — unlike the payload sent to HubSpot, SSN
  // last-4 and date of birth are legitimately part of what a reviewer
  // needs to see here, so nothing is stripped.
  return {
    id: submission.id,
    dealId: submission.dealId,
    status: submission.status,
    createdAt: submission.createdAt.toISOString(),
    submittedAt: submission.submittedAt?.toISOString() ?? null,
    contactInfo: submission.contactInfo
      ? { ...submission.contactInfo, dateOfBirth: submission.contactInfo.dateOfBirth.toISOString().slice(0, 10) }
      : null,
    kycAmlInfo: submission.kycAmlInfo,
    accreditation: submission.accreditation,
    // Date fields become ISO strings, preserving the wire shape the
    // review pages were built against (back when this data arrived
    // JSON-serialized over HTTP from apps/api).
    certification: submission.certification
      ? { ...submission.certification, acceptedAt: submission.certification.acceptedAt.toISOString() }
      : null,
    documents: submission.documents.map((doc) => ({
      id: doc.id,
      category: doc.category,
      originalFilename: doc.originalFilename,
      status: doc.status,
      rejectionReason: doc.rejectionReason,
      createdAt: doc.createdAt.toISOString(),
      confirmedAt: doc.confirmedAt?.toISOString() ?? null,
    })),
    hubspotSync: submission.hubspotSync
      ? {
          ...submission.hubspotSync,
          lastAttemptAt: submission.hubspotSync.lastAttemptAt?.toISOString() ?? null,
          syncedAt: submission.hubspotSync.syncedAt?.toISOString() ?? null,
        }
      : null,
  };
}

export type KycSubmissionDetail = NonNullable<Awaited<ReturnType<typeof getKycSubmissionDetail>>>;
