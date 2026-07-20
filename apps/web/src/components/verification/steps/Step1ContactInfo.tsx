"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { step1Schema, type Step1FormValues } from "../../../lib/validation/verificationSchemas";
import type { InvestorType, TaxIdType } from "../../../lib/constants/verification";
import { TAX_ID_TYPES } from "../../../lib/constants/verification";
import { saveContactInfo, type VerificationDraft } from "../../../lib/api/verificationClient";
import { useFormConfig } from "../../../lib/hooks/useFormConfig";
import { useCustomAnswers } from "../../../lib/hooks/useCustomAnswers";
import { fieldFor, labelFor, visibleOptions } from "../../../lib/verification/formConfig";
import { InvestorTypeCard } from "../InvestorTypeCard";
import { CustomFields } from "../CustomFields";
import { WizardCard, WizardFooterNav } from "../WizardCard";
import { Field, Select, TextInput } from "../../ui/Field";
import {
  codeForIso,
  flagFor,
  orderedCallingCodes,
  splitStoredPhone,
  PINNED_ISOS,
} from "../../../lib/constants/callingCodes";

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
  // Saved drafts hold one combined phone string ("+44 7911 123456");
  // split it back into the calling-code dropdown + national number.
  const storedPhone = splitStoredPhone(draft.contactInfo?.phone);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: draft.contactInfo
      ? {
          ...draft.contactInfo,
          phoneCountryCode: storedPhone.iso,
          phone: storedPhone.national,
          entityName: draft.contactInfo.entityName ?? undefined,
          entityTaxIdLast4: draft.contactInfo.entityTaxIdLast4 ?? undefined,
          coOwnerFirstName: draft.contactInfo.coOwnerFirstName ?? undefined,
          coOwnerLastName: draft.contactInfo.coOwnerLastName ?? undefined,
          coOwnerEmail: draft.contactInfo.coOwnerEmail ?? undefined,
          coOwnerDateOfBirth: draft.contactInfo.coOwnerDateOfBirth ?? undefined,
          coOwnerTaxIdType: draft.contactInfo.coOwnerTaxIdType ?? undefined,
          coOwnerTaxIdLast4: draft.contactInfo.coOwnerTaxIdLast4 ?? undefined,
        }
      : { investorType: "INDIVIDUAL", phoneCountryCode: "US", taxIdType: "SSN" },
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
      const { phoneCountryCode, ...contact } = values;
      await saveContactInfo(
        submissionId,
        { ...contact, phone: `${codeForIso(phoneCountryCode)} ${values.phone.trim()}` },
        custom.payload()
      );
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
          <Field
            label={L("contact.phone", "Phone Number")}
            error={errors.phone?.message ?? errors.phoneCountryCode?.message}
          >
            <div className="flex gap-2">
              {/* Fixed-width wrapper: the Select's own w-full would
                  otherwise fight (and beat) a width utility passed via
                  className, swallowing the whole row. */}
              <div className="w-32 flex-none">
                <Select {...register("phoneCountryCode")} aria-label="Country calling code">
                {orderedCallingCodes().flatMap((entry, index) => [
                  // Divider between the pinned countries and the full list.
                  ...(index === PINNED_ISOS.length
                    ? [
                        <option key="divider" value="" disabled>
                          ──────
                        </option>,
                      ]
                    : []),
                  <option key={entry.iso} value={entry.iso} title={entry.name}>
                    {flagFor(entry.iso)} {entry.code}
                  </option>,
                ])}
                </Select>
              </div>
              <TextInput {...register("phone")} type="tel" placeholder="(555) 000-0000" />
            </div>
          </Field>
          <Field label={L("contact.dateOfBirth", "Date of Birth")} error={errors.dateOfBirth?.message}>
            <TextInput {...register("dateOfBirth")} type="date" />
          </Field>
          <Field
            label={L("contact.taxIdLast4", "Tax ID — Last 4 Digits")}
            error={errors.taxIdLast4?.message ?? errors.taxIdType?.message}
          >
            <div className="flex gap-2">
              <div className="w-24 flex-none">
                <Select {...register("taxIdType")} aria-label="Tax ID type">
                  {TAX_ID_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>
              <TextInput
                {...register("taxIdLast4")}
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
              />
            </div>
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

        {investorType === "ENTITY_TRUST" && (
          <div className="border border-hairline bg-page p-5">
            <h3 className="mb-1 text-sm font-bold text-ink">Entity / Trust Details</h3>
            <p className="mb-4 text-xs text-ink-secondary">
              The legal name and tax ID of the entity or trust this investment is being made through.
            </p>
            <Field
              label={L("contact.entityName", "Entity or Trust Legal Name")}
              error={errors.entityName?.message}
            >
              <TextInput
                {...register("entityName")}
                placeholder="e.g. Harmon Family Trust, Cedar Point Holdings LLC"
              />
            </Field>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <Field
                label={L("contact.entityTaxIdLast4", "EIN — Last 4 Digits")}
                error={errors.entityTaxIdLast4?.message}
              >
                <TextInput
                  {...register("entityTaxIdLast4")}
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                />
              </Field>
            </div>
          </div>
        )}

        {investorType === "JOINT" && (
          <div className="border border-hairline bg-page p-5">
            <h3 className="mb-1 text-sm font-bold text-ink">Co-Owner Information</h3>
            <p className="mb-4 text-xs text-ink-secondary">
              The second person on this account. They&rsquo;re verified to the same standard as the
              primary applicant.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label={L("contact.coOwnerFirstName", "Co-Owner First Name")}
                error={errors.coOwnerFirstName?.message}
              >
                <TextInput {...register("coOwnerFirstName")} placeholder="Alexandra" />
              </Field>
              <Field
                label={L("contact.coOwnerLastName", "Co-Owner Last Name")}
                error={errors.coOwnerLastName?.message}
              >
                <TextInput {...register("coOwnerLastName")} placeholder="Harmon" />
              </Field>
              <Field
                label={L("contact.coOwnerEmail", "Co-Owner Email Address")}
                error={errors.coOwnerEmail?.message}
              >
                <TextInput {...register("coOwnerEmail")} type="email" placeholder="alexandra@example.com" />
              </Field>
              <Field
                label={L("contact.coOwnerDateOfBirth", "Co-Owner Date of Birth")}
                error={errors.coOwnerDateOfBirth?.message}
              >
                <TextInput {...register("coOwnerDateOfBirth")} type="date" />
              </Field>
              <Field
                label={L("contact.coOwnerTaxIdLast4", "Co-Owner Tax ID — Last 4 Digits")}
                error={errors.coOwnerTaxIdLast4?.message ?? errors.coOwnerTaxIdType?.message}
              >
                <div className="flex gap-2">
                  <div className="w-24 flex-none">
                    <Select {...register("coOwnerTaxIdType")} aria-label="Co-owner tax ID type">
                      {TAX_ID_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <TextInput
                    {...register("coOwnerTaxIdLast4")}
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                  />
                </div>
              </Field>
            </div>
          </div>
        )}

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
