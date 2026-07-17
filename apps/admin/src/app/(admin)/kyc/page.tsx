import Link from "next/link";
import { listKycSubmissions } from "@/lib/kyc/repository";
import {
  KYC_ACCREDITATION_METHOD_LABELS,
  KYC_INVESTOR_TYPE_LABELS,
  KYC_STATUS_LABELS,
} from "@/lib/labels";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function KycSubmissionsPage() {
  let submissions: Awaited<ReturnType<typeof listKycSubmissions>> = [];
  let loadError: string | null = null;

  try {
    submissions = await listKycSubmissions();
  } catch (err) {
    // Most likely cause locally: KYC_DATABASE_URL isn't set/reachable,
    // or the KYC Prisma Client hasn't been generated yet (see
    // `npm run --workspace=apps/admin prisma:kyc:generate`).
    loadError = err instanceof Error ? err.message : "Failed to load KYC submissions";
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink">KYC / AML Submissions</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Investor verifications submitted through the marketplace, pulled live from the KYC service.
        </p>
      </div>

      {loadError && (
        <div className="mb-6 border border-warning-text/20 bg-warning-bg px-5 py-4 text-sm text-warning-text">
          Couldn&rsquo;t load KYC submissions: {loadError}. Confirm KYC_DATABASE_URL is set and the
          KYC Prisma Client has been generated (<code>npm run --workspace=apps/admin prisma:kyc:generate</code>).
        </div>
      )}

      <div className="border border-hairline bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              <th className="px-4 py-3">Investor</th>
              <th className="px-4 py-3">Deal</th>
              <th className="px-4 py-3">Investor Type</th>
              <th className="px-4 py-3">Accreditation</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Decision</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-b border-hairline last:border-0 hover:bg-page">
                <td className="px-4 py-3">
                  <Link href={`/kyc/${submission.id}`} className="font-medium text-ink hover:underline">
                    {submission.investorName ?? "—"}
                  </Link>
                  <div className="text-xs text-ink-secondary">{submission.email}</div>
                </td>
                <td className="px-4 py-3 text-ink-secondary">{submission.dealId}</td>
                <td className="px-4 py-3 text-ink-secondary">
                  {submission.investorType ? KYC_INVESTOR_TYPE_LABELS[submission.investorType] : "—"}
                </td>
                <td className="px-4 py-3 text-ink-secondary">
                  {submission.accreditationMethod
                    ? KYC_ACCREDITATION_METHOD_LABELS[submission.accreditationMethod]
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-[11px] font-semibold uppercase ${
                      submission.status === "SUBMITTED"
                        ? "bg-success/10 text-success"
                        : "bg-ink-muted/10 text-ink-muted"
                    }`}
                  >
                    {submission.status === "SUBMITTED" &&
                    submission.firstSubmittedAt &&
                    submission.submittedAt !== submission.firstSubmittedAt
                      ? "Resubmitted"
                      : KYC_STATUS_LABELS[submission.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {submission.reviewStatus === "VERIFIED" ? (
                    <span className="bg-success px-2 py-1 text-[11px] font-semibold uppercase text-white">
                      Verified
                    </span>
                  ) : submission.reviewStatus === "REJECTED" ? (
                    <span className="bg-brand-red/10 px-2 py-1 text-[11px] font-semibold uppercase text-brand-red">
                      Rejected
                    </span>
                  ) : submission.status === "SUBMITTED" ? (
                    <span className="border border-ink-muted px-2 py-1 text-[11px] font-semibold uppercase text-ink-secondary">
                      Pending
                    </span>
                  ) : (
                    <span className="text-ink-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-secondary">{formatDate(submission.submittedAt)}</td>
              </tr>
            ))}
            {submissions.length === 0 && !loadError && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-secondary">
                  No KYC submissions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
