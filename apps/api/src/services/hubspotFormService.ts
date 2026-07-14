import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import {
  MAX_SYNC_ATTEMPTS,
  uploadAllDocuments,
  type SubmissionWithRelations,
  type UploadedHubspotDocument,
} from "./hubspotService.js";

const HUBSPOT_FORMS_API_BASE = "https://api.hsforms.com";

/**
 * Maps our internal field keys to the target HubSpot Form's field
 * *internal names* (Marketing > Forms > [form] > Edit > a field's
 * "Internal name"). These are placeholders based on HubSpot's common
 * default property names — confirm/rename each one to match the actual
 * form once it's built, this is a one-line change per field, not a
 * code change.
 *
 * Same exclusion policy as the contact-record path: ssnLast4 and
 * dateOfBirth are deliberately not sent to HubSpot. Revisit only with
 * compliance/legal sign-off on HubSpot as an approved processor for
 * that data.
 */
export const HUBSPOT_FORM_FIELD_NAMES = {
  firstName: "firstname",
  lastName: "lastname",
  email: "email",
  phone: "phone",
  streetAddress: "address",
  city: "city",
  state: "state",
  zipCode: "zip",
  // Labeled "KYC Investor Type" in HubSpot (not "Investor Type") to avoid
  // colliding with a pre-existing, differently-purposed property of that
  // name already in the portal. Confirm this internal name matches once
  // saved via Settings -> Properties -> Contact properties -> search
  // "KYC Investor Type" -- HubSpot's label->internal-name slugification
  // should produce this, but verify rather than assume.
  investorType: "kyc_investor_type",
  dealId: "deal_id",
  countryOfCitizenship: "country_of_citizenship",
  taxResidence: "tax_residence",
  sourceOfFunds: "source_of_funds",
  accreditationMethod: "accreditation_method",

  // Document categories -> the form's file-upload field internal names.
  // A HubSpot "file upload" field is a text property that stores a URL,
  // not raw bytes — see uploadAllDocuments()/uploadDocumentToHubspotFiles()
  // in hubspotService.ts, which upload to HubSpot Files first and hand
  // back the permanent URL submitted here.
  ID_FRONT: "government_id_front_file",
  ID_BACK: "government_id_back_file",
  PROOF_OF_ADDRESS: "proof_of_address_file",
  ENTITY_FORMATION_DOC: "entity_formation_document_file",
  INCOME_TAX_RETURN: "income_tax_return_file",
  BROKERAGE_STATEMENT: "brokerage_statement_file",
  BANK_STATEMENT: "bank_statement_file",
  CPA_NET_WORTH_LETTER: "cpa_net_worth_letter_file",
  FINRA_CRD_OR_LICENSE: "finra_crd_or_license_file",
  ENTITY_FINANCIALS_OR_TAX_RETURNS: "entity_financials_file",
  CAP_TABLE: "cap_table_file",
  EMPLOYMENT_VERIFICATION_OR_FUND_CERT: "employment_verification_file",
} as const;

interface HubspotFormField {
  name: string;
  value: string;
}

function buildFormFields(
  submission: SubmissionWithRelations,
  uploadedDocs: UploadedHubspotDocument[]
): HubspotFormField[] | null {
  const { contactInfo, kycAmlInfo, accreditation } = submission;
  if (!contactInfo) return null;

  const F = HUBSPOT_FORM_FIELD_NAMES;
  const fields: HubspotFormField[] = [
    { name: F.firstName, value: contactInfo.firstName },
    { name: F.lastName, value: contactInfo.lastName },
    { name: F.email, value: contactInfo.email },
    { name: F.phone, value: contactInfo.phone },
    { name: F.streetAddress, value: contactInfo.streetAddress },
    { name: F.city, value: contactInfo.city },
    { name: F.state, value: contactInfo.state },
    { name: F.zipCode, value: contactInfo.zipCode },
    { name: F.investorType, value: contactInfo.investorType },
    { name: F.dealId, value: submission.dealId },
  ];

  if (kycAmlInfo) {
    fields.push(
      { name: F.countryOfCitizenship, value: kycAmlInfo.countryOfCitizenship },
      { name: F.taxResidence, value: kycAmlInfo.taxResidence },
      { name: F.sourceOfFunds, value: kycAmlInfo.sourceOfFunds }
    );
  }

  if (accreditation) {
    fields.push({ name: F.accreditationMethod, value: accreditation.method });
  }

  for (const doc of uploadedDocs) {
    const fieldName = (F as Record<string, string>)[doc.category];
    if (fieldName) fields.push({ name: fieldName, value: doc.url });
  }

  return fields;
}

/**
 * Submits a completed verification to a native HubSpot Form via the
 * Forms API v3 (POST /submissions/v3/integration/submit/{portalId}/{formGuid}).
 * This is the currently-active integration path (see routes/verifications.ts).
 * The contact-record path (hubspotService.ts's syncSubmissionToHubspot) is
 * built and ready alongside this one for whenever both should run.
 *
 * Note: unlike the Files/CRM APIs, this submission endpoint is
 * unauthenticated by design (portalId + formGuid act as the target) —
 * no bearer token is sent on this call. The access token is still
 * required for the document-upload step, which does need it.
 */
export async function submitToHubspotForm(submissionId: string): Promise<void> {
  const sync = await prisma.hubspotSync.upsert({
    where: { submissionId },
    create: { submissionId, status: "NOT_CONFIGURED" },
    update: {},
  });

  if (!env.HUBSPOT_ACCESS_TOKEN || !env.HUBSPOT_PORTAL_ID || !env.HUBSPOT_FORM_GUID) {
    await prisma.hubspotSync.update({
      where: { submissionId },
      data: { status: "NOT_CONFIGURED", lastAttemptAt: new Date() },
    });
    logger.warn(
      {
        submissionId,
        reason: "HUBSPOT_ACCESS_TOKEN, HUBSPOT_PORTAL_ID, or HUBSPOT_FORM_GUID not set",
      },
      "hubspot form submission skipped: integration not configured"
    );
    return;
  }

  if (sync.attempts >= MAX_SYNC_ATTEMPTS) {
    logger.error({ submissionId }, "hubspot form submission exceeded max attempts, giving up automatic retry");
    return;
  }

  await prisma.hubspotSync.update({
    where: { submissionId },
    data: { status: "PENDING", attempts: { increment: 1 }, lastAttemptAt: new Date() },
  });

  try {
    const submission = await prisma.verificationSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: { contactInfo: true, kycAmlInfo: true, accreditation: true, documents: true, hubspotSync: true },
    });

    const uploadedDocs = await uploadAllDocuments(submission);
    const fields = buildFormFields(submission, uploadedDocs);
    if (!fields) {
      throw new Error("Cannot submit to HubSpot form without contact info");
    }

    const response = await fetch(
      `${HUBSPOT_FORMS_API_BASE}/submissions/v3/integration/submit/${env.HUBSPOT_PORTAL_ID}/${env.HUBSPOT_FORM_GUID}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields,
          context: {
            pageUri: `${env.FRONTEND_ORIGIN}/verify/${submission.dealId}`,
            pageName: "Accredited Investor Verification",
          },
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`HubSpot form submission failed: ${response.status} ${body}`);
    }

    await prisma.hubspotSync.update({
      where: { submissionId },
      data: { status: "SYNCED", syncedAt: new Date(), lastError: null },
    });
    logger.info({ submissionId }, "hubspot form submission succeeded");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.hubspotSync.update({
      where: { submissionId },
      data: { status: "FAILED", lastError: message },
    });
    logger.error({ submissionId, err: message }, "hubspot form submission failed");
  }
}
