"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { step1Schema, type Step1FormValues } from "../../../lib/validation/verificationSchemas";
import { INVESTOR_TYPES, INVESTOR_TYPE_LABELS } from "../../../lib/constants/verification";
import { saveContactInfo, type VerificationDraft } from "../../../lib/api/verificationClient";
import { InvestorTypeCard } from "../InvestorTypeCard";
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

  async function onSubmit(values: Step1FormValues) {
    setSubmitError(null);
    try {
      await saveContactInfo(submissionId, values);
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
          <Field label="First Name" error={errors.firstName?.message}>
            <TextInput {...register("firstName")} placeholder="James" />
          </Field>
          <Field label="Last Name" error={errors.lastName?.message}>
            <TextInput {...register("lastName")} placeholder="Harrington" />
          </Field>
          <Field label="Email Address" error={errors.email?.message}>
            <TextInput {...register("email")} type="email" placeholder="james@example.com" />
          </Field>
          <Field label="Phone Number" error={errors.phone?.message}>
            <TextInput {...register("phone")} type="tel" placeholder="+1 (555) 000-0000" />
          </Field>
          <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
            <TextInput {...register("dateOfBirth")} type="date" />
          </Field>
          <Field label="SSN — Last 4 Digits" error={errors.ssnLast4?.message}>
            <TextInput
              {...register("ssnLast4")}
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
            />
          </Field>
        </div>

        <Field label="Street Address" error={errors.streetAddress?.message}>
          <TextInput {...register("streetAddress")} placeholder="123 Main Street, Apt 4B" />
        </Field>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="City" error={errors.city?.message}>
            <TextInput {...register("city")} placeholder="City" />
          </Field>
          <Field label="State" error={errors.state?.message}>
            <TextInput {...register("state")} placeholder="State" />
          </Field>
          <Field label="ZIP Code" error={errors.zipCode?.message}>
            <TextInput {...register("zipCode")} placeholder="ZIP Code" />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Investor Type
          </span>
          <div className="grid gap-3 sm:grid-cols-3">
            {INVESTOR_TYPES.map((type) => (
              <InvestorTypeCard
                key={type}
                label={INVESTOR_TYPE_LABELS[type]}
                selected={investorType === type}
                onSelect={() => setValue("investorType", type, { shouldValidate: true })}
              />
            ))}
          </div>
          {errors.investorType && (
            <span className="mt-1 block text-xs text-brand-red">{errors.investorType.message}</span>
          )}
        </div>

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
