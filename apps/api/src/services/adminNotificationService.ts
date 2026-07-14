import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { HUBSPOT_FILES_ROOT_FOLDER, investorFolderName } from "./hubspotService.js";

const RESEND_API_BASE = "https://api.resend.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// The friendly label maps (e.g. NET_WORTH -> "Net Worth") live in the
// frontend's constants file, not shared with this backend package — this
// is an internal admin email, not user-facing UI, so a lightly-formatted
// version of the raw enum value is good enough rather than duplicating
// that whole label dictionary here.
function humanize(enumValue: string): string {
  return enumValue
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Notifies the compliance/admin team by email whenever a new verification
 * is submitted. Best-effort: logs and returns on failure rather than
 * retrying — this is a "go take a look" nudge, not the system of record
 * (HubSpot is). Same NOT_CONFIGURED-until-set pattern as the HubSpot
 * integration: absent credentials never block the investor's submission,
 * they just produce a loud log line instead of a silent no-op.
 */
export async function notifyAdminsOfSubmission(submissionId: string): Promise<void> {
  const recipients = (env.ADMIN_NOTIFICATION_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (!env.RESEND_API_KEY || recipients.length === 0) {
    logger.warn(
      { submissionId, reason: "RESEND_API_KEY or ADMIN_NOTIFICATION_EMAILS not set" },
      "admin notification email skipped: integration not configured"
    );
    return;
  }

  try {
    const submission = await prisma.verificationSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { contactInfo: true, kycAmlInfo: true, accreditation: true, documents: true },
    });

    const { contactInfo, accreditation, documents } = submission;
    if (!contactInfo) throw new Error("Cannot send admin notification without contact info");

    const uploadedCount = documents.filter((d) => d.status === "UPLOADED").length;
    const investorName = `${contactInfo.firstName} ${contactInfo.lastName}`;

    const html = `
      <h2>New KYC/AML Verification Submitted</h2>
      <p><strong>${escapeHtml(investorName)}</strong> (${escapeHtml(contactInfo.email)}) just submitted an
      accredited investor verification for deal <strong>${escapeHtml(submission.dealId)}</strong>.</p>
      <table cellpadding="4" cellspacing="0">
        <tr><td>Investor Type</td><td>${humanize(contactInfo.investorType)}</td></tr>
        <tr><td>Phone</td><td>${escapeHtml(contactInfo.phone)}</td></tr>
        <tr><td>Accreditation Method</td><td>${
          accreditation ? humanize(accreditation.method) : "—"
        }</td></tr>
        <tr><td>Documents Uploaded</td><td>${uploadedCount}</td></tr>
        <tr><td>Submitted At</td><td>${submission.submittedAt?.toISOString() ?? "—"}</td></tr>
      </table>
      <p>Full details and uploaded documents are in HubSpot (Contacts / the KYC verification form
      submission) and in the <code>${escapeHtml(HUBSPOT_FILES_ROOT_FOLDER)}/${escapeHtml(
        investorFolderName(submission)
      )}</code> files folder. This submission's internal ID is <code>${escapeHtml(submission.id)}</code>.</p>
    `;

    const response = await fetch(`${RESEND_API_BASE}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM_ADDRESS,
        to: recipients,
        subject: `New investor verification submitted — ${investorName}`,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Resend API failed: ${response.status} ${body}`);
    }

    logger.info({ submissionId, recipients }, "admin notification email sent");
  } catch (err) {
    // Deliberately not written to HubspotSync or any retry table — see
    // module doc comment above.
    logger.error(
      { submissionId, err: err instanceof Error ? err.message : String(err) },
      "admin notification email failed"
    );
  }
}
