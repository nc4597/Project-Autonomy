"use client";

import { useState } from "react";
import { savePageAnswers, type VerificationDraft } from "../../../lib/api/verificationClient";
import { useCustomAnswers } from "../../../lib/hooks/useCustomAnswers";
import type { CustomPage, VerificationFormConfig } from "../../../lib/verification/formConfig";
import { CustomFields } from "../CustomFields";
import { WizardCard, WizardFooterNav } from "../WizardCard";

/**
 * One admin-defined wizard page (config.customPages) — title,
 * description, and its custom fields, saved through the page-answers
 * endpoint. stepNumber is this page's position in the wizard, used to
 * advance the draft's resume point past it on save.
 */
export function StepCustomPage({
  submissionId,
  page,
  config,
  stepNumber,
  draft,
  onSaved,
  onBack,
}: {
  submissionId: string;
  page: CustomPage;
  config: VerificationFormConfig;
  stepNumber: number;
  draft: VerificationDraft;
  onSaved: () => void;
  onBack: () => void;
}) {
  const custom = useCustomAnswers(config, page.key, draft);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleContinue() {
    setSubmitError(null);
    const missing = custom.missingRequiredLabels();
    if (missing.length > 0) {
      setSubmitError(`Please fill in: ${missing.join(", ")}`);
      return;
    }
    setIsSubmitting(true);
    try {
      await savePageAnswers(submissionId, custom.payload(), stepNumber + 1);
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <WizardCard title={page.title} description={page.description}>
        <CustomFields fields={custom.fields} values={custom.values} onChange={custom.setValue} />
        {custom.fields.length === 0 && (
          <p className="text-sm text-ink-secondary">Nothing to fill in here — continue on.</p>
        )}
        {submitError && <p className="text-sm text-brand-red">{submitError}</p>}
      </WizardCard>
      <WizardFooterNav onBack={onBack} onContinue={handleContinue} isSubmitting={isSubmitting} />
    </div>
  );
}
