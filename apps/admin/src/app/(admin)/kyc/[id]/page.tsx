import Link from "next/link";
import { notFound } from "next/navigation";
import { getKycSubmissionDetail } from "@/lib/kyc/repository";
import { KycDocumentRow } from "@/components/KycDocumentRow";
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

  const { contactInfo, kycAmlInfo, accreditation, certification, documents, hubspotSync } = submission;

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
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 text-xs font-semibold uppercase ${
              submission.status === "SUBMITTED" ? "bg-success/10 text-success" : "bg-ink-muted/10 text-ink-muted"
            }`}
          >
            {KYC_STATUS_LABELS[submission.status]}
          </span>
          <a
            href={`/api/kyc/${submission.id}/summary`}
            className="border border-navy-950 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-navy-950 hover:bg-navy-950 hover:text-white"
          >
            Download Summary PDF
          </a>
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
              <Field label="SSN (last 4)" value={contactInfo.ssnLast4} />
              <Field label="Investor Type" value={KYC_INVESTOR_TYPE_LABELS[contactInfo.investorType]} />
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

        <Section title="HubSpot Sync">
          <Field
            label="Status"
            value={
              <span
                className={`px-2 py-1 text-[11px] font-semibold uppercase ${
                  hubspotSync?.status === "SYNCED"
                    ? "bg-success/10 text-success"
                    : hubspotSync?.status === "FAILED"
                      ? "bg-brand-red/10 text-brand-red"
                      : "bg-ink-muted/10 text-ink-muted"
                }`}
              >
                {hubspotSync?.status ?? "NOT_CONFIGURED"}
              </span>
            }
          />
          <Field label="Attempts" value={hubspotSync?.attempts ?? 0} />
          <Field label="Last Attempt" value={formatDateTime(hubspotSync?.lastAttemptAt ?? null)} />
          <Field label="Synced At" value={formatDateTime(hubspotSync?.syncedAt ?? null)} />
          {hubspotSync?.lastError && (
            <div className="py-2.5 text-sm text-brand-red">Error: {hubspotSync.lastError}</div>
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
      </div>
    </div>
  );
}
