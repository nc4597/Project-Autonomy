import Link from "next/link";
import { notFound } from "next/navigation";
import { getKycSubmissionDetail } from "@/lib/kyc/repository";
import { KycDocumentRow } from "@/components/KycDocumentRow";
import { KycReviewSection } from "@/components/KycReviewSection";
import { auth } from "@/auth";
import { isComplianceReviewer } from "@/lib/compliance";
import { env } from "@/lib/env";
import {
  KYC_ACCREDITATION_METHOD_LABELS,
  KYC_DOCUMENT_CATEGORY_LABELS,
  KYC_INVESTOR_TYPE_LABELS,
  KYC_SOURCE_OF_FUNDS_LABELS,
  KYC_STATUS_LABELS,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-2.5 last:border-0">
      <span className="text-sm text-ink-secondary">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-hairline bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-page px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  );
}

const DOC_STATUS_STYLE: Record<string, string> = {
  UPLOADED: "bg-success/10 text-success",
  PENDING: "bg-ink-muted/10 text-ink-muted",
  REJECTED: "bg-brand-red/10 text-brand-red",
};

export default async function KycSubmissionDetailPage({ params }: { params: { id: string } }) {
  let submission;
  try {
    submission = await getKycSubmissionDetail(params.id);
  } catch (err) {
    // A genuine DB/config problem, as opposed to "this ID doesn't
    // exist" (handled by the null check below via notFound()).
    return (
      <div className="border border-warning-text/20 bg-warning-bg px-5 py-4 text-sm text-warning-text">
        Couldn&rsquo;t load this submission: {err instanceof Error ? err.message : "Unknown error"}.
        Confirm KYC_DATABASE_URL is set and the KYC Prisma Client has been generated.
      </div>
    );
  }
  if (!submission) notFound();

  const session = await auth();
  const canReview = await isComplianceReviewer(session?.user?.email);

  const { contactInfo, kycAmlInfo, accreditation, certification, documents } = submission;

  return (
    <div>
      <Link href="/kyc" className="mb-6 inline-block text-xs font-semibold uppercase tracking-wide text-navy-950 hover:underline">
        &larr; Back to Submissions
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">
            {contactInfo ? `${contactInfo.firstName} ${contactInfo.lastName}` : "Unknown Investor"}
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Deal: {submission.dealId} &middot; Submission ID: {submission.id}
          </p>
          {submission.firstSubmittedAt && (
            <p className="mt-1 text-sm text-ink-secondary">
              First submitted {formatDateTime(submission.firstSubmittedAt)}
              {submission.submittedAt && submission.submittedAt !== submission.firstSubmittedAt && (
                <> &middot; Resubmitted {formatDateTime(submission.submittedAt)}</>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 text-xs font-semibold uppercase ${
              submission.status === "SUBMITTED" ? "bg-success/10 text-success" : "bg-ink-muted/10 text-ink-muted"
            }`}
          >
            {submission.status === "SUBMITTED" &&
            submission.firstSubmittedAt &&
            submission.submittedAt !== submission.firstSubmittedAt
              ? "Resubmitted"
              : KYC_STATUS_LABELS[submission.status]}
          </span>
          {submission.reviewStatus === "VERIFIED" && submission.fastTracked ? (
            <span
              className="bg-navy-950 px-3 py-1.5 text-xs font-semibold uppercase text-white"
              title="Auto-verified via the returning-investor fast-track, not a manual review"
            >
              Pre-Verified
            </span>
          ) : submission.reviewStatus === "VERIFIED" ? (
            <span className="bg-success px-3 py-1.5 text-xs font-semibold uppercase text-white">Verified</span>
          ) : submission.reviewStatus === "REJECTED" ? (
            <span className="bg-brand-red/10 px-3 py-1.5 text-xs font-semibold uppercase text-brand-red">Rejected</span>
          ) : submission.status === "SUBMITTED" ? (
            <span className="border border-ink-muted px-3 py-1.5 text-xs font-semibold uppercase text-ink-secondary">
              Pending
            </span>
          ) : null}
          <a
            href={`/api/kyc/${submission.id}/summary`}
            className="border border-navy-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-950 hover:bg-navy-950 hover:text-white"
          >
            Download Summary PDF
          </a>
          {submission.hubspotContactId && env.HUBSPOT_PORTAL_ID && (
            <a
              href={`https://app.hubspot.com/contacts/${env.HUBSPOT_PORTAL_ID}/record/0-1/${submission.hubspotContactId}`}
              target="_blank"
              rel="noreferrer"
              title={submission.hubspotSyncedAt ? `Synced ${formatDateTime(submission.hubspotSyncedAt)}` : undefined}
              className="border border-navy-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-950 hover:bg-navy-950 hover:text-white"
            >
              View in HubSpot ↗
            </a>
          )}
          {submission.hubspotSyncError && !submission.hubspotContactId && (
            <span className="text-xs font-semibold uppercase text-brand-red" title={submission.hubspotSyncError}>
              HubSpot sync failed
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Contact Information">
          {contactInfo ? (
            <>
              <Field label="Email" value={contactInfo.email} />
              <Field label="Phone" value={contactInfo.phone} />
              <Field
                label="Address"
                value={`${contactInfo.streetAddress}, ${contactInfo.city}, ${contactInfo.state} ${contactInfo.zipCode}`}
              />
              <Field label="Date of Birth" value={contactInfo.dateOfBirth} />
              <Field
                label="Tax ID"
                value={`${contactInfo.taxIdType} · last 4: ${contactInfo.taxIdLast4}`}
              />
              <Field label="Investor Type" value={KYC_INVESTOR_TYPE_LABELS[contactInfo.investorType]} />
              {contactInfo.investorType === "ENTITY_TRUST" && (
                <>
                  <Field label="Entity / Trust Name" value={contactInfo.entityName ?? "—"} />
                  <Field label="Entity EIN (last 4)" value={contactInfo.entityTaxIdLast4 ?? "—"} />
                </>
              )}
              {contactInfo.investorType === "JOINT" && (
                <>
                  <Field
                    label="Co-Owner"
                    value={
                      contactInfo.coOwnerFirstName
                        ? `${contactInfo.coOwnerFirstName} ${contactInfo.coOwnerLastName ?? ""}`.trim()
                        : "—"
                    }
                  />
                  <Field label="Co-Owner Email" value={contactInfo.coOwnerEmail ?? "—"} />
                  <Field label="Co-Owner Date of Birth" value={contactInfo.coOwnerDateOfBirth ?? "—"} />
                  <Field
                    label="Co-Owner Tax ID"
                    value={
                      contactInfo.coOwnerTaxIdLast4
                        ? `${contactInfo.coOwnerTaxIdType} · last 4: ${contactInfo.coOwnerTaxIdLast4}`
                        : "—"
                    }
                  />
                  <Field
                    label="Co-Owner Address"
                    value={
                      contactInfo.coOwnerStreetAddress
                        ? `${contactInfo.coOwnerStreetAddress}, ${contactInfo.coOwnerCity}, ${contactInfo.coOwnerState} ${contactInfo.coOwnerZipCode}`
                        : "—"
                    }
                  />
                </>
              )}
              <Field label="Citizenship" value={kycAmlInfo?.countryOfCitizenship ?? "—"} />
              <Field label="Tax Residence" value={kycAmlInfo?.taxResidence ?? "—"} />
            </>
          ) : (
            <p className="py-4 text-sm text-ink-secondary">Not completed yet.</p>
          )}
        </Section>

        <Section title="KYC / AML">
          {kycAmlInfo ? (
            <>
              <Field label="Country of Citizenship" value={kycAmlInfo.countryOfCitizenship} />
              <Field label="Tax Residence" value={kycAmlInfo.taxResidence} />
              <Field
                label="Source of Funds"
                value={KYC_SOURCE_OF_FUNDS_LABELS[kycAmlInfo.sourceOfFunds] ?? kycAmlInfo.sourceOfFunds}
              />
            </>
          ) : (
            <p className="py-4 text-sm text-ink-secondary">Not completed yet.</p>
          )}
        </Section>

        {submission.customAnswers.length > 0 && (
          <Section title="Additional Questions">
            {submission.customAnswers.map((answer) => (
              <Field key={answer.fieldKey} label={answer.label} value={answer.value} />
            ))}
          </Section>
        )}

        <Section title="Accredited Investor">
          <Field label="Qualification" value={accreditation ? KYC_ACCREDITATION_METHOD_LABELS[accreditation.method] : "—"} />
        </Section>

        <Section title="Certification">
          {certification ? (
            <>
              <Field label="Accepted At" value={formatDateTime(certification.acceptedAt)} />
              <Field label="Terms Version" value={certification.tosVersion} />
              <Field label="IP Address" value={certification.ipAddress} />
            </>
          ) : (
            <p className="py-4 text-sm text-ink-secondary">Not certified yet.</p>
          )}
        </Section>

        <div className="lg:col-span-2">
          <Section
            title="Documents"
            action={
              documents.some((doc) => doc.status === "UPLOADED") ? (
                <a
                  href={`/api/kyc/${submission.id}/documents/archive`}
                  className="text-xs font-semibold uppercase tracking-wide text-navy-950 hover:underline"
                >
                  Download All (.zip)
                </a>
              ) : undefined
            }
          >
            {documents.length === 0 && <p className="py-4 text-sm text-ink-secondary">No documents uploaded.</p>}
            {documents.map((doc) => (
              <KycDocumentRow
                key={doc.id}
                submissionId={submission.id}
                docId={doc.id}
                label={KYC_DOCUMENT_CATEGORY_LABELS[doc.category] ?? doc.category}
                filename={doc.originalFilename}
                status={doc.status}
                statusClassName={DOC_STATUS_STYLE[doc.status]}
              />
            ))}
          </Section>
        </div>

        <div className="lg:col-span-2">
          {canReview ? (
            <KycReviewSection
              submissionId={submission.id}
              reviewStatus={submission.reviewStatus}
              reviewNotes={submission.reviewNotes}
              reviewedAt={submission.reviewedAt}
              reviewedBy={submission.reviewedBy}
              fastTracked={submission.fastTracked}
            />
          ) : (
            <div className="border border-dashed border-hairline bg-card px-5 py-4 text-sm text-ink-muted">
              🔒 Compliance review is restricted to authorized reviewers.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
