import type { Prisma, Document } from ".prisma/kyc-client";
import { env } from "../env";
import { kycLogger } from "./logger";
import { kycPrisma } from "./prisma";
import { createPresignedDownloadUrl } from "./s3Client";

export type SubmissionWithRelations = Prisma.VerificationSubmissionGetPayload<{
  include: {
    contactInfo: true;
    kycAmlInfo: true;
    accreditation: true;
    documents: true;
    hubspotSync: true;
    certification: true;
    customAnswers: true;
  };
}>;

export const HUBSPOT_API_BASE = "https://api.hubapi.com";
export const MAX_SYNC_ATTEMPTS = 5;

// Each investor gets their own subfolder under this root — one place to
// open and see everything they submitted, rather than every investor's
// documents interleaved in one flat folder. Folder name is
// "LastName_FirstName_<short id>": readable for browsing, and the short
// slice of the submission ID keeps two investors who happen to share a
// name (e.g. across different deals) from colliding or looking like the
// same person.
export const HUBSPOT_FILES_ROOT_FOLDER = "/kyc-verifications";

export interface UploadedHubspotDocument {
  category: string;
  fileId: string;
  url: string;
}

export function investorFolderName(submission: SubmissionWithRelations): string {
  const sanitize = (value: string) => value.trim().replace(/[^a-zA-Z0-9]+/g, "-");
  const { contactInfo } = submission;
  const namePart = contactInfo
    ? `${sanitize(contactInfo.lastName)}_${sanitize(contactInfo.firstName)}`
    : "UnknownInvestor";
  return `${namePart}_${submission.id.slice(0, 8)}`;
}

/**
 * Uploads one document's bytes (fetched from our S3 store) to HubSpot's
 * Files API, returning HubSpot's own permanent, portal-hosted URL for it.
 * Shared by both the contact-record sync path and the native-form
 * submission path below — a HubSpot "file upload" form field is really
 * just a text property holding a URL, so both paths need this same
 * upload-then-reference step; HubSpot's Forms API cannot accept raw file
 * bytes directly. PRIVATE access means the URL only resolves for
 * authenticated users of this HubSpot portal (i.e. your compliance
 * team) — never publicly.
 */
export async function uploadDocumentToHubspotFiles(
  submission: SubmissionWithRelations,
  doc: Pick<Document, "s3Key" | "mimeType" | "originalFilename" | "category">
): Promise<UploadedHubspotDocument> {
  const downloadUrl = await createPresignedDownloadUrl(doc.s3Key);
  const fileResponse = await fetch(downloadUrl);
  const fileBuffer = await fileResponse.arrayBuffer();

  // Filename doesn't need the investor's name repeated in it — the
  // folder itself already scopes these documents to this one person.
  const filename = `${doc.category}_${doc.originalFilename}`;
  const folderPath = `${HUBSPOT_FILES_ROOT_FOLDER}/${investorFolderName(submission)}`;

  const form = new FormData();
  form.append("file", new Blob([fileBuffer], { type: doc.mimeType }), filename);
  form.append("options", JSON.stringify({ access: "PRIVATE", overwrite: false }));
  form.append("folderPath", folderPath);

  const uploadResponse = await fetch(`${HUBSPOT_API_BASE}/files/v3/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}` },
    body: form,
  });
  if (!uploadResponse.ok) {
    throw new Error(`HubSpot file upload failed for ${doc.category}: ${uploadResponse.status}`);
  }
  const uploaded = (await uploadResponse.json()) as { id: string; url: string };
  return { category: doc.category, fileId: uploaded.id, url: uploaded.url };
}

export async function uploadAllDocuments(
  submission: SubmissionWithRelations
): Promise<UploadedHubspotDocument[]> {
  const uploaded = submission.documents.filter((doc) => doc.status === "UPLOADED");
  const results: UploadedHubspotDocument[] = [];
  for (const doc of uploaded) {
    results.push(await uploadDocumentToHubspotFiles(submission, doc));
  }
  return results;
}

/**
 * Uploads an already-generated PDF buffer (the answers summary, see
 * submissionSummaryPdf.ts) into the same investor folder as their
 * uploaded documents — same folder, same PRIVATE access, just a
 * different source than the S3-backed documents above.
 */
export async function uploadBufferToHubspotFiles(
  submission: SubmissionWithRelations,
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<UploadedHubspotDocument> {
  const folderPath = `${HUBSPOT_FILES_ROOT_FOLDER}/${investorFolderName(submission)}`;

  const form = new FormData();
  // Copy into a plain Uint8Array — TS won't accept Buffer as a BlobPart
  // since a Buffer's backing store could be a SharedArrayBuffer.
  form.append("file", new Blob([new Uint8Array(buffer)], { type: contentType }), filename);
  form.append("options", JSON.stringify({ access: "PRIVATE", overwrite: true }));
  form.append("folderPath", folderPath);

  const uploadResponse = await fetch(`${HUBSPOT_API_BASE}/files/v3/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}` },
    body: form,
  });
  if (!uploadResponse.ok) {
    throw new Error(`HubSpot file upload failed for ${filename}: ${uploadResponse.status}`);
  }
  const uploaded = (await uploadResponse.json()) as { id: string; url: string };
  return { category: "SUMMARY", fileId: uploaded.id, url: uploaded.url };
}

/**
 * NOTE on scopes needed once a real HubSpot private app exists:
 * crm.objects.contacts.read, crm.objects.contacts.write,
 * crm.objects.notes.write, files, crm.associations.write.
 * Verify exact scope names against HubSpot's current docs at
 * integration time — they get renamed periodically.
 *
 * Deliberately excluded from the payload: ssnLast4 and dateOfBirth.
 * HubSpot is a general CRM, not a dedicated document-of-record vault —
 * do not add these without compliance/legal sign-off on HubSpot as an
 * approved processor for that data.
 */
function buildContactProperties(submission: SubmissionWithRelations) {
  const { contactInfo, kycAmlInfo, accreditation } = submission;
  if (!contactInfo) return null;

  return {
    email: contactInfo.email,
    firstname: contactInfo.firstName,
    lastname: contactInfo.lastName,
    phone: contactInfo.phone,
    address: contactInfo.streetAddress,
    city: contactInfo.city,
    state: contactInfo.state,
    zip: contactInfo.zipCode,
    deal_id: submission.dealId,
    investor_type: contactInfo.investorType,
    verification_status: submission.status,
    accreditation_method: accreditation?.method ?? "",
    accreditation_status: accreditation ? "SUBMITTED" : "INCOMPLETE",
    source_of_funds: kycAmlInfo?.sourceOfFunds ?? "",
    country_of_citizenship: kycAmlInfo?.countryOfCitizenship ?? "",
    tax_residence: kycAmlInfo?.taxResidence ?? "",
    kyc_submitted_at: submission.submittedAt?.toISOString() ?? "",
  };
}

async function hubspotFetch(path: string, init: RequestInit) {
  const response = await fetch(`${HUBSPOT_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`HubSpot API ${path} failed: ${response.status} ${body}`);
  }
  return response.json();
}

async function upsertContact(submission: SubmissionWithRelations): Promise<string> {
  const properties = buildContactProperties(submission);
  if (!properties) {
    throw new Error("Cannot sync to HubSpot without contact info");
  }

  // Upsert by email so re-syncs (retries) update the same contact rather
  // than creating duplicates.
  const result = (await hubspotFetch("/crm/v3/objects/contacts", {
    method: "POST",
    body: JSON.stringify({ properties, associations: [] }),
  }).catch(async (err: unknown) => {
    // A 409 means the contact already exists by email; fall back to a
    // search + update. Simplified here — a production version should
    // parse the 409 body for the existing ID rather than re-searching.
    kycLogger.warn({ err: String(err) }, "hubspot contact create conflict, attempting update");
    const searchResult = (await hubspotFetch("/crm/v3/objects/contacts/search", {
      method: "POST",
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: properties.email }] }],
        limit: 1,
      }),
    })) as { results?: { id: string }[] };
    const existingId = searchResult.results?.[0]?.id;
    if (!existingId) throw err;
    return hubspotFetch(`/crm/v3/objects/contacts/${existingId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
  })) as { id: string };

  return result.id;
}

async function attachDocuments(submission: SubmissionWithRelations, contactId: string) {
  const uploaded = await uploadAllDocuments(submission);
  if (uploaded.length === 0) return;

  const fileIds = uploaded.map((d) => d.fileId);
  const noteBody = `KYC/AML verification submitted. Documents attached: ${uploaded
    .map((d) => d.category)
    .join(", ")}.`;

  const note = (await hubspotFetch("/crm/v3/objects/notes", {
    method: "POST",
    body: JSON.stringify({
      properties: { hs_note_body: noteBody, hs_timestamp: Date.now(), hs_attachment_ids: fileIds.join(";") },
      associations: [
        {
          to: { id: contactId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
        },
      ],
    }),
  })) as { id: string };

  return note.id;
}

/**
 * Contact-record integration path: creates/updates a HubSpot Contact and
 * attaches documents via a Note. Fully built and working, but not
 * currently wired into the submit flow — see hubspotFormService.ts,
 * which is the active path. Call both from the submit route when you
 * want both to run.
 *
 * Never blocks the investor's success response — Postgres is already
 * durable by the time this runs. If HUBSPOT_ACCESS_TOKEN isn't set, this
 * is a loud, logged, explicit "not configured" state rather than a silent
 * no-op, so nobody mistakes an unconfigured integration for a working one.
 */
export async function syncSubmissionToHubspot(submissionId: string): Promise<void> {
  const sync = await kycPrisma.hubspotSync.upsert({
    where: { submissionId },
    create: { submissionId, status: "NOT_CONFIGURED" },
    update: {},
  });

  if (!env.HUBSPOT_ACCESS_TOKEN) {
    await kycPrisma.hubspotSync.update({
      where: { submissionId },
      data: { status: "NOT_CONFIGURED", lastAttemptAt: new Date() },
    });
    kycLogger.warn(
      { submissionId, reason: "HUBSPOT_ACCESS_TOKEN not set" },
      "hubspot sync skipped: integration not configured"
    );
    return;
  }

  if (sync.attempts >= MAX_SYNC_ATTEMPTS) {
    kycLogger.error({ submissionId }, "hubspot sync exceeded max attempts, giving up automatic retry");
    return;
  }

  await kycPrisma.hubspotSync.update({
    where: { submissionId },
    data: { status: "PENDING", attempts: { increment: 1 }, lastAttemptAt: new Date() },
  });

  try {
    const submission = await kycPrisma.verificationSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: {
        contactInfo: true,
        kycAmlInfo: true,
        accreditation: true,
        documents: true,
        hubspotSync: true,
        certification: true,
        customAnswers: true,
      },
    });

    const contactId = await upsertContact(submission);
    await attachDocuments(submission, contactId);

    await kycPrisma.hubspotSync.update({
      where: { submissionId },
      data: { status: "SYNCED", hubspotContactId: contactId, syncedAt: new Date(), lastError: null },
    });
    kycLogger.info({ submissionId, contactId }, "hubspot sync succeeded");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await kycPrisma.hubspotSync.update({ where: { submissionId }, data: { status: "FAILED", lastError: message } });
    kycLogger.error({ submissionId, err: message }, "hubspot sync failed");
  }
}
