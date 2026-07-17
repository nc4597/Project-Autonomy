import { env } from "../env";
import { kycLogger } from "./logger";
import { kycPrisma } from "./prisma";
import { SUBMISSION_INCLUDE } from "./serialize";

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// The friendly label maps (e.g. NET_WORTH -> "Net Worth") live in
// apps/web's constants file, not shared with this package — this is an
// internal notification email, not user-facing UI, so a lightly-
// formatted version of the raw enum value is good enough rather than
// duplicating that whole label dictionary here.
function humanize(enumValue: string): string {
  return enumValue
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Notifies the compliance/admin team by email whenever a new
 * verification is submitted, via a Zapier webhook (the Zap sends the
 * actual email through a connected real mailbox). Best-effort: logs and
 * returns on failure rather than retrying — this is a "go take a look"
 * nudge, not the system of record (the KYC database behind the admin
 * panel is). NOT_CONFIGURED-until-set: skips loudly when the webhook or
 * recipient env vars are absent.
 */
export async function notifyAdminsOfSubmission(submissionId: string): Promise<void> {
  const recipients = (env.ADMIN_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  const webhookUrl = env.ZAPIER_KYC_NOTIFICATION_WEBHOOK_URL;
  if (!webhookUrl || recipients.length === 0) {
    kycLogger.warn(
      { submissionId, reason: "ZAPIER_KYC_NOTIFICATION_WEBHOOK_URL or ADMIN_NOTIFICATION_EMAILS not set" },
      "admin notification email skipped: integration not configured"
    );
    return;
  }

  try {
    const submission = await kycPrisma.verificationSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: SUBMISSION_INCLUDE,
    });

    const { contactInfo, accreditation, documents } = submission;
    if (!contactInfo) throw new Error("Cannot send admin notification without contact info");

    const uploadedCount = documents.filter((d) => d.status === "UPLOADED").length;
    const investorName = `${contactInfo.firstName} ${contactInfo.lastName}`;

    // Deep link straight to this submission's review page — documents
    // (inline previews + downloads) and the summary PDF all live there.
    const adminReviewUrl = env.ADMIN_APP_ORIGIN
      ? `${env.ADMIN_APP_ORIGIN.replace(/\/$/, "")}/kyc/${submission.id}`
      : null;

    const html = `
      <p>Dear Rob,</p>
      <p>${escapeHtml(investorName)} (${escapeHtml(
        contactInfo.email
      )}) has submitted accredited investor verification materials in connection with
      ${escapeHtml(submission.dealId)}.</p>
      <p>Please review the submitted documentation and answer summary in the admin panel and
      confirm that the materials are complete and sufficient for the applicable accreditation
      requirements:</p>
      <p>${
        adminReviewUrl
          ? `<a href="${adminReviewUrl}">${escapeHtml(adminReviewUrl)}</a>`
          : "(Admin panel link not yet configured — open KYC Review in the admin CMS and select the investor.)"
      }</p>
      <p>Thank you,<br>The Regiment Securities Team</p>
    `;

    // Sent as flat fields (not just the html blob) so the Zap's email
    // action can map each one into the message individually without
    // having to parse HTML.
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipients,
        subject: `New investor verification submitted — ${investorName}`,
        html,
        submissionId: submission.id,
        investorName,
        investorEmail: contactInfo.email,
        investorPhone: contactInfo.phone,
        investorType: humanize(contactInfo.investorType),
        dealId: submission.dealId,
        accreditationMethod: accreditation ? humanize(accreditation.method) : "—",
        documentsUploaded: uploadedCount,
        submittedAt: submission.submittedAt?.toISOString() ?? null,
        adminReviewUrl,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Zapier webhook failed: ${response.status} ${body}`);
    }

    kycLogger.info({ submissionId, recipients }, "admin notification webhook sent");
  } catch (err) {
    kycLogger.error(
      { submissionId, err: err instanceof Error ? err.message : String(err) },
      "admin notification email failed"
    );
  }
}

/**
 * Emails the investor when their submission is rejected: the reviewer's
 * notes verbatim plus a link back to the reopened wizard. Sent through
 * the same Zapier webhook as the admin notification — the Zap's email
 * action must map the recipient from the payload's `to` field, since
 * this one goes to the investor rather than the admin list. Returns
 * whether the webhook accepted the send.
 */
export async function notifyInvestorOfRejection(submissionId: string, notes: string): Promise<boolean> {
  const webhookUrl = env.ZAPIER_KYC_NOTIFICATION_WEBHOOK_URL;
  if (!webhookUrl) {
    kycLogger.warn(
      { submissionId, reason: "ZAPIER_KYC_NOTIFICATION_WEBHOOK_URL not set" },
      "rejection email skipped: integration not configured"
    );
    return false;
  }

  try {
    const submission = await kycPrisma.verificationSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: SUBMISSION_INCLUDE,
    });
    const { contactInfo } = submission;
    if (!contactInfo) throw new Error("Cannot email a rejection without contact info");

    const resubmitUrl = `${env.FRONTEND_ORIGIN.replace(/\/$/, "")}/verify/${submission.dealId}`;
    const notesHtml = escapeHtml(notes).replace(/\n/g, "<br />");

    const html = `
      <p>Dear ${escapeHtml(contactInfo.firstName)},</p>
      <p>Our compliance team has reviewed your accredited investor verification for
      <strong>${escapeHtml(submission.dealId)}</strong> and we need a few updates before we can
      approve it:</p>
      <div style="border-left:3px solid #C8102E; background:#F5F4F1; padding:12px 14px; margin:0 0 14px; color:#10233E;">${notesHtml}</div>
      <p>Your verification has been reopened with everything you previously entered still in
      place &mdash; you only need to correct the items above, re-upload the relevant documents,
      and submit again:</p>
      <p><a href="${resubmitUrl}" style="display:inline-block; background:#071C35; color:#ffffff; padding:11px 20px; font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; text-decoration:none;">Update My Verification</a></p>
      <p>Thank you,<br>The Regiment Securities Team</p>
    `;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: [contactInfo.email],
        subject: "Action needed — updates required on your investor verification",
        html,
        submissionId: submission.id,
        investorName: `${contactInfo.firstName} ${contactInfo.lastName}`,
        investorEmail: contactInfo.email,
        dealId: submission.dealId,
        reviewNotes: notes,
        resubmitUrl,
      }),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Zapier webhook failed: ${response.status} ${body}`);
    }

    kycLogger.info({ submissionId, to: contactInfo.email }, "rejection email webhook sent");
    return true;
  } catch (err) {
    kycLogger.error(
      { submissionId, err: err instanceof Error ? err.message : String(err) },
      "rejection email failed"
    );
    return false;
  }
}
