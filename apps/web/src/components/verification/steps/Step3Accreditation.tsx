"use client";

import { useState } from "react";
import {
  ACCREDITATION_METHODS,
  ACCREDITATION_METHOD_DETAILS,
  SUPPORTING_DOC_REQUIREMENTS,
  DOCUMENT_LABELS,
  type AccreditationMethod,
} from "../../../lib/constants/verification";
import { saveAccreditation, type VerificationDraft } from "../../../lib/api/verificationClient";
import { QualificationMethodCard } from "../QualificationMethodCard";
import { FileDropzone } from "../FileDropzone";
import { WizardCard, WizardFooterNav } from "../WizardCard";
import { useVerificationStore } from "../../../lib/state/verificationStore";

export function Step3Accreditation({
  submissionId,
  draft,
  onSaved,
  onBack,
}: {
  submissionId: string;
  draft: VerificationDraft;
  onSaved: () => void;
  onBack: () => void;
}) {
  const [method, setMethod] = useState<AccreditationMethod | null>(draft.accreditation?.method ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const documents = useVerificationStore((s) => s.draft?.documents ?? []);

  const requirements = method ? SUPPORTING_DOC_REQUIREMENTS[method] : [];
  const missingRequired = requirements.filter(
    (req) =>
      req.required && !documents.some((doc) => doc.category === req.category && doc.status === "UPLOADED")
  );

  async function handleContinue() {
    setSubmitError(null);
    if (!method) {
      setSubmitError("Select a qualification method to continue.");
      return;
    }
    if (missingRequired.length > 0) {
      setSubmitError("Please upload all required supporting documentation before continuing.");
      return;
    }
    setIsSubmitting(true);
    try {
      await saveAccreditation(submissionId, { method });
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <WizardCard
        title="Accredited Investor"
        description="Select the basis on which you qualify as an accredited investor under SEC Rule 501."
      >
        <div className="space-y-3">
          {ACCREDITATION_METHODS.map((m) => (
            <QualificationMethodCard
              key={m}
              title={ACCREDITATION_METHOD_DETAILS[m].title}
              description={ACCREDITATION_METHOD_DETAILS[m].description}
              selected={method === m}
              onSelect={() => setMethod(m)}
            />
          ))}
        </div>

        {method && (
          <div>
            <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Supporting Documentation
            </span>
            <div className="space-y-4">
              {requirements.map((req) => (
                <FileDropzone
                  key={req.category}
                  submissionId={submissionId}
                  category={req.category}
                  title={DOCUMENT_LABELS[req.category].title}
                  optional={!req.required}
                />
              ))}
            </div>
          </div>
        )}

        {submitError && <p className="text-sm text-brand-red">{submitError}</p>}
      </WizardCard>

      <WizardFooterNav onBack={onBack} onContinue={handleContinue} isSubmitting={isSubmitting} />
    </div>
  );
}
