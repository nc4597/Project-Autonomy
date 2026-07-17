import { kycPrisma } from "@/lib/kyc/prisma";
import { kycLogger } from "@/lib/kyc/logger";
import { SUBMISSION_INCLUDE } from "@/lib/kyc/serialize";
import { validateSubmissionCompleteness } from "@/lib/kyc/submissionValidation";
import { notifyAdminsOfSubmission } from "@/lib/kyc/submissionNotificationService";
import { syncContactCard } from "@/lib/kyc/hubspotContactService";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const submission = await kycPrisma.verificationSubmission.findUnique({
    where: { id: params.id },
    include: SUBMISSION_INCLUDE,
  });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  const errors = validateSubmissionCompleteness(submission);
  if (errors.length > 0) {
    return jsonWithCors({ error: "Submission is incomplete", details: errors }, { status: 422 });
  }

  const updated = await kycPrisma.verificationSubmission.update({
    where: { id: submission.id },
    data: { status: "SUBMITTED", submittedAt: new Date() },
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
