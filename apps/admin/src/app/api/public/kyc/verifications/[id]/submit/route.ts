import { kycPrisma } from "@/lib/kyc/prisma";
import { draftSecretValid, draftUnauthorized } from "@/lib/kyc/draftAuth";
import { kycLogger } from "@/lib/kyc/logger";
import { SUBMISSION_INCLUDE } from "@/lib/kyc/serialize";
import { validateSubmissionCompleteness } from "@/lib/kyc/submissionValidation";
import { getPublishedFormConfig } from "@/lib/kyc/formConfig";
import { notifyAdminsOfSubmission } from "@/lib/kyc/submissionNotificationService";
import { syncContactCard } from "@/lib/kyc/hubspotContactService";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const submission = await kycPrisma.verificationSubmission.findUnique({
    where: { id: params.id },
    include: SUBMISSION_INCLUDE,
  });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (!draftSecretValid(submission, request)) return draftUnauthorized();
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  // Turnstile captcha removed 2026-07-20 (widget was failing to load in
  // production and dead-ending submissions). Every submission still goes
  // through human compliance review. Frontend no longer sends a token;
  // re-add verifyCaptchaToken here + SecurityCheckModal on the web side
  // to restore it.

  const formConfig = await getPublishedFormConfig().catch(() => null);
  const errors = validateSubmissionCompleteness(submission, formConfig);
  if (errors.length > 0) {
    return jsonWithCors({ error: "Submission is incomplete", details: errors }, { status: 422 });
  }

  const updated = await kycPrisma.verificationSubmission.update({
    where: { id: submission.id },
    // A resubmission after rejection returns to a fresh PENDING review.
    // submittedAt is the latest (re)submission; firstSubmittedAt is the
    // original and is never overwritten — compliance needs both dates.
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      firstSubmittedAt: submission.firstSubmittedAt ?? new Date(),
      reviewStatus: "PENDING",
      reviewNotes: null,
      reviewedAt: null,
      reviewedBy: null,
    },
  });

  // Fire-and-forget: neither the notification email nor the HubSpot
  // contact card is on the critical path for the investor's success
  // response — Postgres is already durable by the time this runs, and
  // the admin panel reads from it directly.
  syncContactCard(updated.id).catch((err) => {
    kycLogger.error({ submissionId: updated.id, err: String(err) }, "unhandled hubspot contact card error");
  });
  notifyAdminsOfSubmission(updated.id).catch((err) => {
    kycLogger.error({ submissionId: updated.id, err: String(err) }, "unhandled admin notification error");
  });

  kycLogger.info({ submissionId: updated.id }, "submission submitted");
  return jsonWithCors({ ok: true, submittedAt: updated.submittedAt });
}
