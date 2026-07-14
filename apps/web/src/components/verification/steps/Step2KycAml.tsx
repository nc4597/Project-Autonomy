"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { step2Schema, type Step2FormValues } from "../../../lib/validation/verificationSchemas";
import {
  SOURCE_OF_FUNDS,
  SOURCE_OF_FUNDS_LABELS,
  COUNTRY_OPTIONS,
  DOCUMENT_LABELS,
  KYC_REQUIRED_DOCUMENT_CATEGORIES,
} from "../../../lib/constants/verification";
import { saveKycAmlInfo, type VerificationDraft } from "../../../lib/api/verificationClient";
import { FileDropzone } from "../FileDropzone";
import { WizardCard, WizardFooterNav } from "../WizardCard";
import { useVerificationStore } from "../../../lib/state/verificationStore";
import { Field, Select } from "../../ui/Field";
import { ComplianceNotice } from "../../ui/ComplianceNotice";

export function Step2KycAml({
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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const documents = useVerificationStore((s) => s.draft?.documents ?? []);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: draft.kycAmlInfo ?? { countryOfCitizenship: "United States", taxResidence: "United States" },
  });

  const missingRequiredDocs = KYC_REQUIRED_DOCUMENT_CATEGORIES.filter(
    (category) => !documents.some((doc) => doc.category === category && doc.status === "UPLOADED")
  );

  async function onSubmit(values: Step2FormValues) {
    setSubmitError(null);
    if (missingRequiredDocs.length > 0) {
      setSubmitError("Please upload all required documents before continuing.");
      return;
    }
    try {
      await saveKycAmlInfo(submissionId, values);
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <WizardCard title="KYC / AML Verification">
        <ComplianceNotice>
          Federal regulations require identity verification for all private investment participants
          under the Bank Secrecy Act and AML compliance requirements.
        </ComplianceNotice>

        <div>
          <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Government-Issued ID
          </span>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileDropzone
              submissionId={submissionId}
              category="ID_FRONT"
              title={DOCUMENT_LABELS.ID_FRONT.title}
              helperText={DOCUMENT_LABELS.ID_FRONT.helperText}
            />
            <FileDropzone
              submissionId={submissionId}
              category="ID_BACK"
              title={DOCUMENT_LABELS.ID_BACK.title}
              helperText={DOCUMENT_LABELS.ID_BACK.helperText}
            />
          </div>
        </div>

        <div>
          <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Proof of Address
          </span>
          <FileDropzone
            submissionId={submissionId}
            category="PROOF_OF_ADDRESS"
            title={DOCUMENT_LABELS.PROOF_OF_ADDRESS.title}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Country of Citizenship">
            <Select {...register("countryOfCitizenship")}>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tax Residence">
            <Select {...register("taxResidence")}>
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Source of Funds" error={errors.sourceOfFunds?.message}>
          <Select {...register("sourceOfFunds")}>
            {SOURCE_OF_FUNDS.map((s) => (
              <option key={s} value={s}>
                {SOURCE_OF_FUNDS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Entity Documents <span className="font-normal normal-case text-ink-muted">(optional)</span>
          </span>
          <FileDropzone
            submissionId={submissionId}
            category="ENTITY_FORMATION_DOC"
            title={DOCUMENT_LABELS.ENTITY_FORMATION_DOC.title}
            optional
          />
        </div>

        {submitError && <p className="text-sm text-brand-red">{submitError}</p>}
      </WizardCard>

      <WizardFooterNav onBack={onBack} onContinue={handleSubmit(onSubmit)} isSubmitting={isSubmitting} />
    </form>
  );
}
