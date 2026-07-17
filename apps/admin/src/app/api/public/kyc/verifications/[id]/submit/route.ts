import { kycPrisma } from "@/lib/kyc/prisma";
import { kycLogger } from "@/lib/kyc/logger";
import { SUBMISSION_INCLUDE } from "@/lib/kyc/serialize";
import { validateSubmissionCompleteness } from "@/lib/kyc/submissionValidation";
import { getPublishedFormConfig } from "@/lib/kyc/formConfig";
import { notifyAdminsOfSubmission } from "@/lib/kyc/submissionNotificationService";
import { syncContactCard } from "@/lib/kyc/hubspotContactService";
import { verifyCaptchaToken } from "@/lib/kyc/turnstile";
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
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  // Security check before anything else: the browser earned this token
  // in the Turnstile popup; a submission without a valid one is a bot
  // (or the integration isn't configured yet, which verifyCaptchaToken
  // treats as a loud skip).
  const body = (await request.json().catch(() => ({}))) as { captchaToken?: unknown };
  const remoteIp =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const captcha = await verifyCaptchaToken(body.captchaToken, remoteIp);
  if (!captcha.ok) {
    kycLogger.warn({ submissionId: submission.id, reason: captcha.reason }, "submission blocked: captcha failed");
    return jsonWithCors({ error: "Security check failed. Please try again." }, { status: 403 });
  }

  const formConfig = await getPublishedFormConfig().catch(() => null);
  const errors = validateSubmissionCompleteness(submission, formConfig);
  if (errors.length > 0) {
    return jsonWithCors({ error: "Submission is incomplete", details: errors }, { status: 422 });
  }

  const updated = await kycPrisma.verificationSubmission.update({
    where: { id: submission.id },
    // A resubmission after rejection returns to a fresh PENDING review.
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      reviewStatus: "PENDING",
      reviewNotes: null,
      reviewedAt: null,
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
