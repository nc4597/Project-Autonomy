import { env } from "../env";
import { kycLogger } from "./logger";
import { kycPrisma } from "./prisma";
import { SUBMISSION_INCLUDE, type SubmissionWithRelations } from "./serialize";

const HUBSPOT_API_BASE = "https://api.hubapi.com";

/**
 * Deliberately excluded from the payload: ssnLast4 and dateOfBirth.
 * HubSpot is a general CRM, not a document-of-record vault — those stay
 * in the KYC database and the admin panel's summary PDF only. Do not add
 * them without compliance/legal sign-off on HubSpot as an approved
 * processor for that data.
 *
 * The non-standard properties (deal_id, investor_type, …) must exist as
 * contact properties in the portal (Settings → Properties); if HubSpot
 * rejects the payload over an unknown property, the sync retries with
 * just the built-in ones so the card is still created.
 */
function buildContactProperties(submission: SubmissionWithRelations) {
  const { contactInfo, kycAmlInfo, accreditation } = submission;
  if (!contactInfo) return null;

  const standard: Record<string, string> = {
    email: contactInfo.email,
    firstname: contactInfo.firstName,
    lastname: contactInfo.lastName,
    phone: contactInfo.phone,
    address: contactInfo.streetAddress,
    city: contactInfo.city,
    state: contactInfo.state,
    zip: contactInfo.zipCode,
  };
  const custom: Record<string, string> = {
    deal_id: submission.dealId,
    investor_type: contactInfo.investorType,
    verification_status: submission.status,
    accreditation_method: accreditation?.method ?? "",
    source_of_funds: kycAmlInfo?.sourceOfFunds ?? "",
    country_of_citizenship: kycAmlInfo?.countryOfCitizenship ?? "",
    tax_residence: kycAmlInfo?.taxResidence ?? "",
    kyc_submitted_at: submission.submittedAt?.toISOString() ?? "",
  };
  return { standard, custom };
}

async function hubspotFetch(path: string, body: unknown): Promise<Response> {
  return fetch(`${HUBSPOT_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
}

/** The duplicate check: looks up an existing contact card by email. */
async function findContactIdByEmail(email: string): Promise<string | null> {
  const response = await hubspotFetch("/crm/v3/objects/contacts/search", {
    filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
    properties: ["email"],
    limit: 1,
  });
  if (!response.ok) {
    throw new Error(`HubSpot contact search failed: ${response.status} ${await response.text().catch(() => "")}`);
  }
  const result = (await response.json()) as { results?: { id: string }[] };
  return result.results?.[0]?.id ?? null;
}

async function updateContact(contactId: string, properties: Record<string, string>): Promise<Response> {
  return fetch(`${HUBSPOT_API_BASE}/crm/v3/objects/contacts/${contactId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ properties }),
  });
}

/**
 * Create-or-update with dedupe:
 *  1. search by email — if a card exists, update it in place;
 *  2. otherwise create one;
 *  3. if the create still hits a 409 (a card created after our search,
 *     or one HubSpot's search index hadn't caught up to), parse the
 *     existing ID out of the conflict response and update that card.
 * Either way exactly one contact card per email address.
 */
async function upsertContactByEmail(
  properties: Record<string, string>
): Promise<{ contactId: string; action: "updated" | "created" }> {
  const existingId = await findContactIdByEmail(properties.email);
  if (existingId) {
    const response = await updateContact(existingId, properties);
    if (!response.ok) {
      throw new Error(`HubSpot contact update failed: ${response.status} ${await response.text().catch(() => "")}`);
    }
    return { contactId: existingId, action: "updated" };
  }

  const createResponse = await hubspotFetch("/crm/v3/objects/contacts", { properties });
  if (createResponse.ok) {
    const created = (await createResponse.json()) as { id: string };
    return { contactId: created.id, action: "created" };
  }

  const body = await createResponse.text().catch(() => "");
  if (createResponse.status === 409) {
    const conflictId = /Existing ID:\s*(\d+)/.exec(body)?.[1] ?? (await findContactIdByEmail(properties.email));
    if (conflictId) {
      const response = await updateContact(conflictId, properties);
      if (!response.ok) {
        throw new Error(
          `HubSpot contact update after conflict failed: ${response.status} ${await response.text().catch(() => "")}`
        );
      }
      return { contactId: conflictId, action: "updated" };
    }
  }
  throw new Error(`HubSpot contact create failed: ${createResponse.status} ${body}`);
}

/**
 * Creates/updates the investor's HubSpot contact card for a submitted
 * verification. Fire-and-forget from the submit route: never blocks the
 * investor's success response — Postgres is already durable and the
 * admin panel is the system of record; the card is a CRM convenience.
 * If HUBSPOT_ACCESS_TOKEN isn't set this is a loud, logged "not
 * configured" skip rather than a silent no-op. Outcome (contact ID or
 * error) is recorded on the submission row.
 */
export async function syncContactCard(submissionId: string): Promise<void> {
  if (!env.HUBSPOT_ACCESS_TOKEN) {
    kycLogger.warn(
      { submissionId, reason: "HUBSPOT_ACCESS_TOKEN not set" },
      "hubspot contact card skipped: integration not configured"
    );
    return;
  }

  try {
    const submission = await kycPrisma.verificationSubmission.findUniqueOrThrow({
      where: { id: submissionId },
      include: SUBMISSION_INCLUDE,
    });
    const properties = buildContactProperties(submission);
    if (!properties) throw new Error("Cannot sync a contact card without contact info");

    let result;
    try {
      result = await upsertContactByEmail({ ...properties.standard, ...properties.custom });
    } catch (err) {
      // Portal may not have the custom KYC properties defined — better a
      // card with the built-in fields than no card at all.
      const message = err instanceof Error ? err.message : String(err);
      if (!/property/i.test(message)) throw err;
      kycLogger.warn(
        { submissionId, err: message, dropped: Object.keys(properties.custom) },
        "hubspot rejected custom properties, retrying contact card with standard fields only"
      );
      result = await upsertContactByEmail(properties.standard);
    }

    await kycPrisma.verificationSubmission.update({
      where: { id: submissionId },
      data: { hubspotContactId: result.contactId, hubspotSyncedAt: new Date(), hubspotSyncError: null },
    });
    kycLogger.info({ submissionId, ...result }, "hubspot contact card synced");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await kycPrisma.verificationSubmission
      .update({ where: { id: submissionId }, data: { hubspotSyncError: message } })
      .catch(() => {});
    kycLogger.error({ submissionId, err: message }, "hubspot contact card sync failed");
  }
}
