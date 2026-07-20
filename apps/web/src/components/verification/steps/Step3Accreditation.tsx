"use client";

import { useState } from "react";
import {
  ACCREDITATION_METHOD_DETAILS,
  ACCREDITATION_METHODS_BY_INVESTOR_TYPE,
  SUPPORTING_DOC_REQUIREMENTS,
  DOCUMENT_LABELS,
  type AccreditationMethod,
} from "../../../lib/constants/verification";
import { saveAccreditation, type VerificationDraft } from "../../../lib/api/verificationClient";
import { useFormConfig } from "../../../lib/hooks/useFormConfig";
import { useCustomAnswers } from "../../../lib/hooks/useCustomAnswers";
import { fieldFor, visibleOptions } from "../../../lib/verification/formConfig";
import { QualificationMethodCard } from "../QualificationMethodCard";
import { FileDropzone } from "../FileDropzone";
import { CustomFields } from "../CustomFields";
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
  const config = useFormConfig();
  const custom = useCustomAnswers(config, 3, draft);
  const [method, setMethod] = useState<AccreditationMethod | null>(draft.accreditation?.method ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const documents = useVerificationStore((s) => s.draft?.documents ?? []);
  // Only show the qualification methods that apply to this investor type
  // (individuals/joint qualify personally; entities on the entity test).
  const investorType = draft.contactInfo?.investorType;
  const allowedMethods = investorType ? ACCREDITATION_METHODS_BY_INVESTOR_TYPE[investorType] : null;
  const methodOptions = visibleOptions(fieldFor(config, "accreditation.method")).filter(
    (option) => !allowedMethods || allowedMethods.includes(option.value as AccreditationMethod)
  );
  // If a previously-saved method no longer applies (e.g. the investor type
  // changed), ignore it so the investor reselects from the valid list.
  const effectiveMethod =
    method && (!allowedMethods || allowedMethods.includes(method)) ? method : null;

  const requirements = effectiveMethod ? SUPPORTING_DOC_REQUIREMENTS[effectiveMethod] : [];
  const missingRequired = requirements.filter(
    (req) =>
      req.required && !documents.some((doc) => doc.category === req.category && doc.status === "UPLOADED")
  );

  async function handleContinue() {
    setSubmitError(null);
    if (!effectiveMethod) {
      setSubmitError("Select a qualification method to continue.");
      return;
    }
    if (missingRequired.length > 0) {
      setSubmitError("Please upload all required supporting documentation before continuing.");
      return;
    }
    const missingCustom = custom.missingRequiredLabels();
    if (missingCustom.length > 0) {
      setSubmitError(`Please fill in: ${missingCustom.join(", ")}`);
      return;
    }
    setIsSubmitting(true);
    try {
      await saveAccreditation(submissionId, { method: effectiveMethod }, custom.payload());
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
          {methodOptions.map((option) => (
            <QualificationMethodCard
              key={option.value}
              title={option.label}
              description={
                ACCREDITATION_METHOD_DETAILS[option.value as AccreditationMethod]?.description ?? ""
              }
              selected={effectiveMethod === option.value}
              onSelect={() => setMethod(option.value as AccreditationMethod)}
            />
          ))}
        </div>

        {effectiveMethod && (
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

        <CustomFields fields={custom.fields} values={custom.values} onChange={custom.setValue} />

        {submitError && <p className="text-sm text-brand-red">{submitError}</p>}
      </WizardCard>

      <WizardFooterNav onBack={onBack} onContinue={handleContinue} isSubmitting={isSubmitting} />
    </div>
  );
}
