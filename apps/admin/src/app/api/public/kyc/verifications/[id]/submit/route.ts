import { kycPrisma } from "@/lib/kyc/prisma";
import { kycLogger } from "@/lib/kyc/logger";
import { SUBMISSION_INCLUDE } from "@/lib/kyc/serialize";
import { validateSubmissionCompleteness } from "@/lib/kyc/submissionValidation";
import { submitToHubspotForm } from "@/lib/kyc/hubspotFormService";
import { notifyAdminsOfSubmission } from "@/lib/kyc/submissionNotificationService";
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

  // Fire-and-forget: neither HubSpot nor the notification email is on
  // the critical path for the investor's success response — Postgres is
  // already durable by the time this runs. Active path is the native
  // HubSpot Form submission; the contact-record path
  // (lib/kyc/hubspotService.ts) is built and ready — call
  // syncSubmissionToHubspot(updated.id) here too whenever both should run.
  submitToHubspotForm(updated.id).catch((err) => {
    kycLogger.error({ submissionId: updated.id, err: String(err) }, "unhandled hubspot form submission error");
  });
  notifyAdminsOfSubmission(updated.id).catch((err) => {
    kycLogger.error({ submissionId: updated.id, err: String(err) }, "unhandled admin notification error");
  });

  kycLogger.info({ submissionId: updated.id }, "submission submitted");
  return jsonWithCors({ ok: true, submittedAt: updated.submittedAt });
}
