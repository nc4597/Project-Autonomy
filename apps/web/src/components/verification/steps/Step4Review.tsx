"use client";

import { useState } from "react";
import Link from "next/link";
import {
  INVESTOR_TYPE_LABELS,
  SOURCE_OF_FUNDS_LABELS,
  ACCREDITATION_METHOD_DETAILS,
  DOCUMENT_LABELS,
  SUPPORTING_DOC_REQUIREMENTS,
} from "../../../lib/constants/verification";
import { saveCertification, submitVerification, type VerificationDraft } from "../../../lib/api/verificationClient";
import { useFormConfig } from "../../../lib/hooks/useFormConfig";
import { customFieldsForStep } from "../../../lib/verification/formConfig";
import { SummaryRow } from "../SummaryRow";
import { WizardCard, WizardFooterNav } from "../WizardCard";
import { ComplianceNotice } from "../../ui/ComplianceNotice";
import { SecurityCheckModal } from "../SecurityCheckModal";

const TOS_VERSION = "2026-07-14";

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function SummarySection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-hairline">
      <div className="flex items-center justify-between bg-page px-6 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink">{title}</span>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold uppercase tracking-wide text-brand-red hover:text-brand-red-dark"
        >
          Edit
        </button>
      </div>
      <div className="px-6 py-2">{children}</div>
    </div>
  );
}

export function Step4Review({
  submissionId,
  draft,
  onBack,
  onEditStep,
  onSubmitted,
}: {
  submissionId: string;
  draft: VerificationDraft;
  onBack: () => void;
  onEditStep: (step: number) => void;
  onSubmitted: () => void;
}) {
  const config = useFormConfig();
  const [certified, setCertified] = useState(Boolean(draft.certification));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkOpen, setCheckOpen] = useState(false);

  // Inlined into the client bundle at build time (Dockerfile ARG on the
  // Railway service). Unset = no popup, submit directly — keeps local
  // dev and pre-configuration production working.
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const answersByKey = Object.fromEntries(
    (draft.customAnswers ?? []).map((a) => [a.fieldKey, a.value])
  );
  const customRowsForStep = (step: 1 | 2 | 3) =>
    customFieldsForStep(config, step)
      .map((field) => ({ label: field.label, value: answersByKey[field.key] }))
      .filter((row) => row.value);

  const uploadedDocs = draft.documents.filter((doc) => doc.status === "UPLOADED");
  const idUploaded = uploadedDocs.some((d) => d.category === "ID_FRONT") && uploadedDocs.some((d) => d.category === "ID_BACK");
  const proofOfAddressUploaded = uploadedDocs.some((d) => d.category === "PROOF_OF_ADDRESS");

  // "Supporting Docs" should only list documents relevant to the chosen
  // accreditation method (e.g. brokerage/bank statements for Net Worth) —
  // not every document uploaded anywhere in the wizard, which would
  // wrongly mix in the KYC/AML identity documents from step 2.
  const accreditationDocCategories = draft.accreditation
    ? SUPPORTING_DOC_REQUIREMENTS[draft.accreditation.method].map((r) => r.category)
    : [];
  const accreditationDocs = uploadedDocs.filter((d) => accreditationDocCategories.includes(d.category));

  async function completeSubmit(captchaToken?: string) {
    setIsSubmitting(true);
    try {
      await saveCertification(submissionId, TOS_VERSION);
      await submitVerification(submissionId, captchaToken);
      onSubmitted();
    } catch (err) {
      setCheckOpen(false);
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit() {
    setSubmitError(null);
    if (!certified) {
      setSubmitError("You must certify before submitting.");
      return;
    }
    if (!turnstileSiteKey) {
      void completeSubmit();
      return;
    }
    // The security-check popup takes it from here: Turnstile verifies
    // (usually hands-free), then completeSubmit runs with the token.
    setCheckOpen(true);
  }

  return (
    <div>
      <WizardCard title="Review & Submit" description="Review your information before submitting for compliance review.">
        <SummarySection title="Contact Information" onEdit={() => onEditStep(1)}>
          {draft.contactInfo && (
            <>
              <SummaryRow label="Name" value={`${draft.contactInfo.firstName} ${draft.contactInfo.lastName}`} />
              <SummaryRow label="Email" value={draft.contactInfo.email} />
              <SummaryRow label="Phone" value={draft.contactInfo.phone} />
              <SummaryRow
                label="Address"
                value={`${draft.contactInfo.streetAddress}, ${draft.contactInfo.city}, ${draft.contactInfo.state} ${draft.contactInfo.zipCode}`}
              />
              <SummaryRow label="Date of Birth" value={formatDate(draft.contactInfo.dateOfBirth)} />
              <SummaryRow label="Investor Type" value={INVESTOR_TYPE_LABELS[draft.contactInfo.investorType]} />
            </>
          )}
          {customRowsForStep(1).map((row) => (
            <SummaryRow key={row.label} label={row.label} value={row.value} />
          ))}
        </SummarySection>

        <SummarySection title="KYC / AML" onEdit={() => onEditStep(2)}>
          <SummaryRow label="Government ID" value={idUploaded ? "Uploaded" : "Missing"} />
          <SummaryRow label="Proof of Address" value={proofOfAddressUploaded ? "Uploaded" : "Missing"} />
          {draft.kycAmlInfo && (
            <>
              <SummaryRow label="Citizenship" value={draft.kycAmlInfo.countryOfCitizenship} />
              <SummaryRow label="Tax Residence" value={draft.kycAmlInfo.taxResidence} />
              <SummaryRow
                label="Source of Funds"
                value={
                  (SOURCE_OF_FUNDS_LABELS as Record<string, string>)[draft.kycAmlInfo.sourceOfFunds] ??
                  draft.kycAmlInfo.sourceOfFunds
                }
              />
            </>
          )}
          {customRowsForStep(2).map((row) => (
            <SummaryRow key={row.label} label={row.label} value={row.value} />
          ))}
        </SummarySection>

        <SummarySection title="Accredited Investor" onEdit={() => onEditStep(3)}>
          <SummaryRow label="Accredited?" value={draft.accreditation ? "Yes" : "No"} />
          {draft.accreditation && (
            <SummaryRow label="Qualification" value={ACCREDITATION_METHOD_DETAILS[draft.accreditation.method].title} />
          )}
          <SummaryRow
            label="Supporting Docs"
            value={
              accreditationDocs.length > 0
                ? accreditationDocs.map((d) => DOCUMENT_LABELS[d.category].title).join(", ")
                : "None uploaded"
            }
          />
          {customRowsForStep(3).map((row) => (
            <SummaryRow key={row.label} label={row.label} value={row.value} />
          ))}
        </SummarySection>

        {config.customPages.map((page, index) => {
          const rows = customFieldsForStep(config, page.key)
            .map((field) => ({ label: field.label, value: answersByKey[field.key] }))
            .filter((row) => row.value);
          return (
            <SummarySection key={page.key} title={page.title} onEdit={() => onEditStep(4 + index)}>
              {rows.length > 0 ? (
                rows.map((row) => <SummaryRow key={row.label} label={row.label} value={row.value} />)
              ) : (
                <p className="py-3 text-sm text-ink-secondary">Nothing filled in.</p>
              )}
            </SummarySection>
          );
        })}

        <ComplianceNotice>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => setCertified(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span>
              {config.certificationText} I have read and agree to Regiment Securities&rsquo;{" "}
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </ComplianceNotice>

        {submitError && <p className="text-sm text-brand-red">{submitError}</p>}
      </WizardCard>

      <WizardFooterNav
        onBack={onBack}
        onContinue={handleSubmit}
        continueLabel="Submit Verification"
        continueDisabled={!certified}
        isSubmitting={isSubmitting}
      />

      {checkOpen && turnstileSiteKey && (
        <SecurityCheckModal
          siteKey={turnstileSiteKey}
          submitting={isSubmitting}
          onToken={(token) => void completeSubmit(token)}
          onCancel={() => setCheckOpen(false)}
        />
      )}
    </div>
  );
}
