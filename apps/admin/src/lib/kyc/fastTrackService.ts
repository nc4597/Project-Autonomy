import { kycPrisma } from "./prisma";
import { prisma } from "../prisma";
import { kycLogger } from "./logger";
import { SUBMISSION_INCLUDE, type SubmissionWithRelations } from "./serialize";
import { copyObject, buildDocumentKey } from "./s3Client";
import { notifyRepOfVerification } from "./submissionNotificationService";
import { syncContactCard } from "./hubspotContactService";

// How far back a prior VERIFIED accreditation still counts as current.
export const ACCREDITATION_VALIDITY_YEARS = 3;
const VALIDITY_MS = ACCREDITATION_VALIDITY_YEARS * 365 * 24 * 60 * 60 * 1000;

export type FastTrackMatch =
  | { status: "none" }
  | { status: "expired" }
  | { status: "match"; submission: SubmissionWithRelations };

/**
 * Looks up the most recent VERIFIED submission for this email + tax ID
 * last-4 (the pair the returning-investor precheck asks for) and checks
 * it against the validity window. "none" and "expired" are reported
 * separately — the investor-facing copy this feeds already distinguishes
 * them (see the approved mockup), so the caller doesn't need to guess.
 */
export async function findFastTrackMatch(email: string, taxIdLast4: string): Promise<FastTrackMatch> {
  const submission = await kycPrisma.verificationSubmission.findFirst({
    where: {
      reviewStatus: "VERIFIED",
      contactInfo: { email: { equals: email, mode: "insensitive" }, taxIdLast4 },
    },
    include: SUBMISSION_INCLUDE,
    orderBy: { reviewedAt: "desc" },
  });
  if (!submission) return { status: "none" };

  const verifiedAt = submission.reviewedAt?.getTime() ?? 0;
  if (Date.now() - verifiedAt > VALIDITY_MS) return { status: "expired" };
  return { status: "match", submission };
}

/**
 * Copies a prior verified submission's answers and documents onto a
 * brand-new draft (already created for the current deal when the wizard
 * loaded) and marks it verified — the "skip to thank you" path. Documents
 * are physically copied to new S3 keys rather than shared by reference,
 * since either submission's normal document-delete flow would otherwise
 * blow away the other's file.
 *
 * Never throws: any failure is logged and reported back as `false` so the
 * caller falls back to a normal application instead of leaving a half
 * fast-tracked submission behind.
 */
export async function applyFastTrack(
  target: { id: string },
  source: SubmissionWithRelations,
  requestMeta: { ip: string; userAgent: string }
): Promise<boolean> {
  try {
    if (!source.contactInfo || !source.kycAmlInfo || !source.accreditation || !source.certification) {
      throw new Error("Source submission is missing required records");
    }

    const uploadedDocs = source.documents.filter((doc) => doc.status === "UPLOADED");
    const copiedDocs = [];
    for (const doc of uploadedDocs) {
      const destinationKey = buildDocumentKey(target.id, doc.category, doc.originalFilename);
      await copyObject(doc.s3Key, destinationKey);
      copiedDocs.push({
        category: doc.category,
        s3Key: destinationKey,
        originalFilename: doc.originalFilename,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
      });
    }

    // The rep-notification email's Reply-To is the reviewer whose
    // compliance judgment is being extended to this new deal — not
    // whoever (if anyone) is signed in right now, since this path never
    // touches the admin panel.
    const reviewer = source.reviewedBy
      ? await prisma.adminUser.findFirst({
          where: { email: { equals: source.reviewedBy, mode: "insensitive" } },
          select: { name: true },
        })
      : null;

    await kycPrisma.$transaction([
      kycPrisma.contactInfo.create({
        data: {
          submissionId: target.id,
          firstName: source.contactInfo.firstName,
          lastName: source.contactInfo.lastName,
          email: source.contactInfo.email,
          phone: source.contactInfo.phone,
          dateOfBirth: source.contactInfo.dateOfBirth,
          taxIdType: source.contactInfo.taxIdType,
          taxIdLast4: source.contactInfo.taxIdLast4,
          streetAddress: source.contactInfo.streetAddress,
          city: source.contactInfo.city,
          state: source.contactInfo.state,
          zipCode: source.contactInfo.zipCode,
          investorType: source.contactInfo.investorType,
          entityName: source.contactInfo.entityName,
          entityTaxIdLast4: source.contactInfo.entityTaxIdLast4,
          coOwnerFirstName: source.contactInfo.coOwnerFirstName,
          coOwnerLastName: source.contactInfo.coOwnerLastName,
          coOwnerEmail: source.contactInfo.coOwnerEmail,
          coOwnerDateOfBirth: source.contactInfo.coOwnerDateOfBirth,
          coOwnerTaxIdType: source.contactInfo.coOwnerTaxIdType,
          coOwnerTaxIdLast4: source.contactInfo.coOwnerTaxIdLast4,
        },
      }),
      kycPrisma.kycAmlInfo.create({
        data: {
          submissionId: target.id,
          countryOfCitizenship: source.kycAmlInfo.countryOfCitizenship,
          taxResidence: source.kycAmlInfo.taxResidence,
          sourceOfFunds: source.kycAmlInfo.sourceOfFunds,
        },
      }),
      kycPrisma.accreditationInfo.create({
        data: { submissionId: target.id, method: source.accreditation.method },
      }),
      kycPrisma.certificationAcceptance.create({
        data: {
          submissionId: target.id,
          acceptedAt: new Date(),
          tosVersion: source.certification.tosVersion,
          ipAddress: requestMeta.ip,
          userAgent: requestMeta.userAgent,
        },
      }),
      ...copiedDocs.map((doc) =>
        kycPrisma.document.create({
          data: {
            submissionId: target.id,
            category: doc.category,
            s3Key: doc.s3Key,
            originalFilename: doc.originalFilename,
            mimeType: doc.mimeType,
            sizeBytes: doc.sizeBytes,
            status: "UPLOADED",
            confirmedAt: new Date(),
          },
        })
      ),
      ...source.customAnswers.map((answer) =>
        kycPrisma.customAnswer.create({
          data: {
            submissionId: target.id,
            fieldKey: answer.fieldKey,
            label: answer.label,
            value: answer.value,
          },
        })
      ),
      kycPrisma.verificationSubmission.update({
        where: { id: target.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          firstSubmittedAt: new Date(),
          reviewStatus: "VERIFIED",
          reviewNotes: `Auto-verified — returning investor fast-track, sourced from submission ${source.id} (originally verified ${
            source.reviewedAt?.toISOString().slice(0, 10) ?? "unknown date"
          }).`,
          reviewedAt: new Date(),
          reviewedBy: source.reviewedBy,
          fastTracked: true,
          fastTrackedFromId: source.id,
        },
      }),
    ]);

    // Fire-and-forget, same as a normal submission: neither is on the
    // critical path for the investor's success response.
    syncContactCard(target.id).catch((err) => {
      kycLogger.error({ submissionId: target.id, err: String(err) }, "unhandled hubspot contact card error");
    });
    const emailSent = await notifyRepOfVerification(target.id, {
      name: reviewer?.name ?? null,
      email: source.reviewedBy,
    });
    kycLogger.info({ submissionId: target.id, sourceId: source.id, emailSent }, "submission fast-tracked");
    return true;
  } catch (err) {
    kycLogger.error(
      { targetId: target.id, sourceId: source.id, err: err instanceof Error ? err.message : String(err) },
      "fast-track failed"
    );
    return false;
  }
}
