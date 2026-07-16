import { env } from "../env";
import { kycLogger } from "./logger";
import { kycPrisma } from "./prisma";
import { HUBSPOT_FILES_ROOT_FOLDER, investorFolderName } from "./hubspotService";
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
 * nudge, not the system of record (HubSpot is). Same
 * NOT_CONFIGURED-until-set pattern as the HubSpot integration.
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
      // Full include (not just the fields this email uses) so the result
      // satisfies SubmissionWithRelations for investorFolderName().
      include: SUBMISSION_INCLUDE,
    });

    const { contactInfo, accreditation, documents } = submission;
    if (!contactInfo) throw new Error("Cannot send admin notification without contact info");

    const uploadedCount = documents.filter((d) => d.status === "UPLOADED").length;
    const investorName = `${contactInfo.firstName} ${contactInfo.lastName}`;

    const hubspotFolderPath = `${HUBSPOT_FILES_ROOT_FOLDER}/${investorFolderName(submission)}`;
    const investorFolder = investorFolderName(submission);
    // Links to the shared root /kyc-verifications folder (same link in
    // every email) — the investor's own subfolder lives inside it, named
    // below, since each investor's numeric per-folder ID isn't known
    // ahead of time without an extra HubSpot API lookup.
    const hubspotFolderUrl =
      env.HUBSPOT_PORTAL_ID && env.HUBSPOT_KYC_ROOT_FOLDER_ID
        ? `https://app.hubspot.com/files/${env.HUBSPOT_PORTAL_ID}/?folderId=${env.HUBSPOT_KYC_ROOT_FOLDER_ID}`
        : null;
    const pandaDocUrl = env.PANDADOC_CERTIFICATION_TEMPLATE_URL ?? null;

    const html = `
      <p>Dear Rob,</p>
      <p>${escapeHtml(investorName)} (${escapeHtml(
        contactInfo.email
      )}) has submitted accredited investor verification materials in connection with
      ${escapeHtml(submission.dealId)}.</p>
      <p>Please review the submitted documentation in the HubSpot folder below (look for the
      <strong>${escapeHtml(investorFolder)}</strong> subfolder) and confirm that the materials are
      complete and sufficient for the applicable accreditation requirements:</p>
      <p>${
        hubspotFolderUrl
          ? `<a href="${hubspotFolderUrl}">${escapeHtml(hubspotFolderUrl)}</a>`
          : "(HubSpot folder link not yet configured)"
      }</p>
      <p>Following your review, please complete and sign the related PandaDoc certification here:</p>
      <p>${
        pandaDocUrl ? `<a href="${pandaDocUrl}">${escapeHtml(pandaDocUrl)}</a>` : "(PandaDoc link not yet configured)"
      }</p>
      <p>Please note any missing, expired, inconsistent, or insufficient documentation before signing.</p>
      <p>Thank you,<br>The Regiment Marketplace Team</p>
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
        hubspotFolderPath,
        hubspotFolderUrl,
        pandaDocUrl,
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
