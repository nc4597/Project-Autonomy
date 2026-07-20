"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { step2Schema, type Step2FormValues } from "../../../lib/validation/verificationSchemas";
import {
  DOCUMENT_LABELS,
  kycRequiredDocumentCategories,
} from "../../../lib/constants/verification";
import { saveKycAmlInfo, type VerificationDraft } from "../../../lib/api/verificationClient";
import { useFormConfig } from "../../../lib/hooks/useFormConfig";
import { useCustomAnswers } from "../../../lib/hooks/useCustomAnswers";
import { fieldFor, helpFor, labelFor, visibleOptions } from "../../../lib/verification/formConfig";
import { FileDropzone } from "../FileDropzone";
import { CustomFields } from "../CustomFields";
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
  const config = useFormConfig();
  const custom = useCustomAnswers(config, 2, draft);
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

  const investorType = draft.contactInfo?.investorType ?? "INDIVIDUAL";
  const isJoint = investorType === "JOINT";
  const missingRequiredDocs = kycRequiredDocumentCategories(investorType).filter(
    (category) => !documents.some((doc) => doc.category === category && doc.status === "UPLOADED")
  );

  async function onSubmit(values: Step2FormValues) {
    setSubmitError(null);
    if (missingRequiredDocs.length > 0) {
      setSubmitError("Please upload all required documents before continuing.");
      return;
    }
    const missing = custom.missingRequiredLabels();
    if (missing.length > 0) {
      setSubmitError(`Please fill in: ${missing.join(", ")}`);
      return;
    }
    try {
      await saveKycAmlInfo(submissionId, values, custom.payload());
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
          {isJoint && " Joint accounts must verify both account holders."}
        </ComplianceNotice>

        <div>
          <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            {isJoint ? "Primary Applicant's Government-Issued ID" : "Government-Issued ID"}
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

        {isJoint && (
          <div>
            <span className="mb-3 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              Co-Owner&rsquo;s Government-Issued ID
            </span>
            <div className="grid gap-4 sm:grid-cols-2">
              <FileDropzone
                submissionId={submissionId}
                category="CO_OWNER_ID_FRONT"
                title={DOCUMENT_LABELS.CO_OWNER_ID_FRONT.title}
                helperText={DOCUMENT_LABELS.CO_OWNER_ID_FRONT.helperText}
              />
              <FileDropzone
                submissionId={submissionId}
                category="CO_OWNER_ID_BACK"
                title={DOCUMENT_LABELS.CO_OWNER_ID_BACK.title}
                helperText={DOCUMENT_LABELS.CO_OWNER_ID_BACK.helperText}
              />
            </div>
          </div>
        )}

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
          <Field label={labelFor(config, "kyc.countryOfCitizenship", "Country of Citizenship")}>
            <Select {...register("countryOfCitizenship")}>
              {visibleOptions(fieldFor(config, "kyc.countryOfCitizenship")).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={labelFor(config, "kyc.taxResidence", "Tax Residence")}>
            <Select {...register("taxResidence")}>
              {visibleOptions(fieldFor(config, "kyc.taxResidence")).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div>
          <Field
            label={labelFor(config, "kyc.sourceOfFunds", "Source of Funds")}
            error={errors.sourceOfFunds?.message}
          >
            <Select {...register("sourceOfFunds")}>
              {visibleOptions(fieldFor(config, "kyc.sourceOfFunds")).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          {helpFor(config, "kyc.sourceOfFunds") && (
            <p className="mt-1 text-xs text-ink-muted">{helpFor(config, "kyc.sourceOfFunds")}</p>
          )}
        </div>

        <CustomFields fields={custom.fields} values={custom.values} onChange={custom.setValue} />

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
