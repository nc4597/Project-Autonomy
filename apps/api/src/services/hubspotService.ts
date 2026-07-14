import type { Prisma } from "@prisma/client";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { createPresignedDownloadUrl } from "../lib/s3Client.js";

type SubmissionWithRelations = Prisma.VerificationSubmissionGetPayload<{
  include: {
    contactInfo: true;
    kycAmlInfo: true;
    accreditation: true;
    documents: true;
    hubspotSync: true;
  };
}>;

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const MAX_SYNC_ATTEMPTS = 5;

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
    body: JSON.stringify({
      properties,
      associations: [],
    }),
  }).catch(async (err: unknown) => {
    // A 409 means the contact already exists by email; fall back to a
    // search + update. Simplified here — a production version should
    // parse the 409 body for the existing ID rather than re-searching.
    logger.warn({ err: String(err) }, "hubspot contact create conflict, attempting update");
    const searchResult = (await hubspotFetch("/crm/v3/objects/contacts/search", {
      method: "POST",
      body: JSON.stringify({
        filterGroups: [
          { filters: [{ propertyName: "email", operator: "EQ", value: properties.email }] },
        ],
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
  const uploaded = submission.documents.filter((doc) => doc.status === "UPLOADED");
  if (uploaded.length === 0) return;

  const fileIds: string[] = [];
  for (const doc of uploaded) {
    const downloadUrl = await createPresignedDownloadUrl(doc.s3Key);
    const fileResponse = await fetch(downloadUrl);
    const fileBuffer = await fileResponse.arrayBuffer();

    const form = new FormData();
    form.append("file", new Blob([fileBuffer], { type: doc.mimeType }), doc.originalFilename);
    form.append(
      "options",
      JSON.stringify({ access: "PRIVATE", overwrite: false })
    );
    form.append("folderPath", `/kyc-verifications/${submission.id}`);

    const uploadResponse = await fetch(`${HUBSPOT_API_BASE}/files/v3/files`, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}` },
      body: form,
    });
    if (!uploadResponse.ok) {
      throw new Error(`HubSpot file upload failed for ${doc.category}: ${uploadResponse.status}`);
    }
    const uploaded_ = (await uploadResponse.json()) as { id: string };
    fileIds.push(uploaded_.id);
  }

  const noteBody = `KYC/AML verification submitted. Documents attached: ${uploaded
    .map((d) => d.category)
    .join(", ")}.`;

  const note = (await hubspotFetch("/crm/v3/objects/notes", {
    method: "POST",
    body: JSON.stringify({
      properties: {
        hs_note_body: noteBody,
        hs_timestamp: Date.now(),
        hs_attachment_ids: fileIds.join(";"),
      },
      associations: [
        {
          to: { id: contactId },
          types: [
            {
              associationCategory: "HUBSPOT_DEFINED",
              associationTypeId: 202, // note-to-contact association type
            },
          ],
        },
      ],
    }),
  })) as { id: string };

  return note.id;
}

/**
 * Entry point called right after a submission is marked SUBMITTED.
 * Never blocks the investor's success response — Postgres is already
 * durable by the time this runs. If HUBSPOT_ACCESS_TOKEN isn't set, this
 * is a loud, logged, explicit "not configured" state rather than a silent
 * no-op, so nobody mistakes an unconfigured integration for a working one.
 */
export async function syncSubmissionToHubspot(submissionId: string): Promise<void> {
  const sync = await prisma.hubspotSync.upsert({
    where: { submissionId },
    create: { submissionId, status: "NOT_CONFIGURED" },
    update: {},
  });

  if (!env.HUBSPOT_ACCESS_TOKEN) {
    await prisma.hubspotSync.update({
      where: { submissionId },
      data: { status: "NOT_CONFIGURED", lastAttemptAt: new Date() },
    });
    logger.warn(
      { submissionId, reason: "HUBSPOT_ACCESS_TOKEN not set" },
      "hubspot sync skipped: integration not configured"
    );
    return;
  }

  if (sync.attempts >= MAX_SYNC_ATTEMPTS) {
    logger.error({ submissionId }, "hubspot sync exceeded max attempts, giving up automatic retry");
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

    const contactId = await upsertContact(submission);
    await attachDocuments(submission, contactId);

    await prisma.hubspotSync.update({
      where: { submissionId },
      data: { status: "SYNCED", hubspotContactId: contactId, syncedAt: new Date(), lastError: null },
    });
    logger.info({ submissionId, contactId }, "hubspot sync succeeded");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.hubspotSync.update({
      where: { submissionId },
      data: { status: "FAILED", lastError: message },
    });
    logger.error({ submissionId, err: message }, "hubspot sync failed");
  }
}
