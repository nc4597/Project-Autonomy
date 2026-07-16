"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { step1Schema, type Step1FormValues } from "../../../lib/validation/verificationSchemas";
import type { InvestorType } from "../../../lib/constants/verification";
import { saveContactInfo, type VerificationDraft } from "../../../lib/api/verificationClient";
import { useFormConfig } from "../../../lib/hooks/useFormConfig";
import { useCustomAnswers } from "../../../lib/hooks/useCustomAnswers";
import { fieldFor, labelFor, visibleOptions } from "../../../lib/verification/formConfig";
import { InvestorTypeCard } from "../InvestorTypeCard";
import { CustomFields } from "../CustomFields";
import { WizardCard, WizardFooterNav } from "../WizardCard";
import { Field, TextInput } from "../../ui/Field";

export function Step1ContactInfo({
  submissionId,
  draft,
  dealHref,
  onSaved,
}: {
  submissionId: string;
  draft: VerificationDraft;
  dealHref: string;
  onSaved: () => void;
}) {
  const config = useFormConfig();
  const custom = useCustomAnswers(config, 1, draft);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: draft.contactInfo ?? { investorType: "INDIVIDUAL" },
  });

  const investorType = watch("investorType");
  const L = (key: string, fallback: string) => labelFor(config, key, fallback);
  const investorTypeField = fieldFor(config, "contact.investorType");

  async function onSubmit(values: Step1FormValues) {
    setSubmitError(null);
    const missing = custom.missingRequiredLabels();
    if (missing.length > 0) {
      setSubmitError(`Please fill in: ${missing.join(", ")}`);
      return;
    }
    try {
      await saveContactInfo(submissionId, values, custom.payload());
      onSaved();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <WizardCard
        title="Contact Information"
        description="All information is encrypted in transit and at rest. We will never share your information with third parties."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label={L("contact.firstName", "First Name")} error={errors.firstName?.message}>
            <TextInput {...register("firstName")} placeholder="James" />
          </Field>
          <Field label={L("contact.lastName", "Last Name")} error={errors.lastName?.message}>
            <TextInput {...register("lastName")} placeholder="Harrington" />
          </Field>
          <Field label={L("contact.email", "Email Address")} error={errors.email?.message}>
            <TextInput {...register("email")} type="email" placeholder="james@example.com" />
          </Field>
          <Field label={L("contact.phone", "Phone Number")} error={errors.phone?.message}>
            <TextInput {...register("phone")} type="tel" placeholder="+1 (555) 000-0000" />
          </Field>
          <Field label={L("contact.dateOfBirth", "Date of Birth")} error={errors.dateOfBirth?.message}>
            <TextInput {...register("dateOfBirth")} type="date" />
          </Field>
          <Field label={L("contact.ssnLast4", "SSN — Last 4 Digits")} error={errors.ssnLast4?.message}>
            <TextInput
              {...register("ssnLast4")}
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
            />
          </Field>
        </div>

        <Field label={L("contact.streetAddress", "Street Address")} error={errors.streetAddress?.message}>
          <TextInput {...register("streetAddress")} placeholder="123 Main Street, Apt 4B" />
        </Field>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field label={L("contact.city", "City")} error={errors.city?.message}>
            <TextInput {...register("city")} placeholder="City" />
          </Field>
          <Field label={L("contact.state", "State")} error={errors.state?.message}>
            <TextInput {...register("state")} placeholder="State" />
          </Field>
          <Field label={L("contact.zipCode", "ZIP Code")} error={errors.zipCode?.message}>
            <TextInput {...register("zipCode")} placeholder="ZIP Code" />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            {L("contact.investorType", "Investor Type")}
          </span>
          <div className="grid gap-3 sm:grid-cols-3">
            {visibleOptions(investorTypeField).map((option) => (
              <InvestorTypeCard
                key={option.value}
                label={option.label}
                selected={investorType === option.value}
                onSelect={() =>
                  setValue("investorType", option.value as InvestorType, { shouldValidate: true })
                }
              />
            ))}
          </div>
          {errors.investorType && (
            <span className="mt-1 block text-xs text-brand-red">{errors.investorType.message}</span>
          )}
        </div>

        <CustomFields fields={custom.fields} values={custom.values} onChange={custom.setValue} />

        {submitError && <p className="text-sm text-brand-red">{submitError}</p>}
      </WizardCard>

      <WizardFooterNav
        onBack={() => {
          window.location.href = dealHref;
        }}
        backLabel="Back to Deal"
        onContinue={handleSubmit(onSubmit)}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}
