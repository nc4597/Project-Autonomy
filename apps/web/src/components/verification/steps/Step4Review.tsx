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
import { SummaryRow } from "../SummaryRow";
import { WizardCard, WizardFooterNav } from "../WizardCard";
import { ComplianceNotice } from "../../ui/ComplianceNotice";

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
  const [certified, setCertified] = useState(Boolean(draft.certification));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  async function handleSubmit() {
    setSubmitError(null);
    if (!certified) {
      setSubmitError("You must certify before submitting.");
      return;
    }
    setIsSubmitting(true);
    try {
      await saveCertification(submissionId, TOS_VERSION);
      await submitVerification(submissionId);
      onSubmitted();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
        </SummarySection>

        <SummarySection title="KYC / AML" onEdit={() => onEditStep(2)}>
          <SummaryRow label="Government ID" value={idUploaded ? "Uploaded" : "Missing"} />
          <SummaryRow label="Proof of Address" value={proofOfAddressUploaded ? "Uploaded" : "Missing"} />
          {draft.kycAmlInfo && (
            <>
              <SummaryRow label="Citizenship" value={draft.kycAmlInfo.countryOfCitizenship} />
              <SummaryRow label="Tax Residence" value={draft.kycAmlInfo.taxResidence} />
              <SummaryRow label="Source of Funds" value={SOURCE_OF_FUNDS_LABELS[draft.kycAmlInfo.sourceOfFunds]} />
            </>
          )}
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
        </SummarySection>

        <ComplianceNotice>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={certified}
              onChange={(e) => setCertified(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0"
            />
            <span>
              I certify that all information provided is accurate and complete to the best of my knowledge.
              I understand that providing false or misleading information in connection with a securities
              offering may constitute a federal crime. I have read and agree to Regiment Securities&rsquo;{" "}
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
    </div>
  );
}
