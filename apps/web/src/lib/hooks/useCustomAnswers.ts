"use client";

import { useState } from "react";
import type { VerificationDraft } from "../api/verificationClient";
import {
  customFieldsForStep,
  type VerificationFormConfig,
} from "../verification/formConfig";

/**
 * State for one step's admin-defined custom fields: values keyed by
 * field key (seeded from the saved draft), required-check, and the
 * payload to send with the step's PATCH.
 */
export function useCustomAnswers(
  config: VerificationFormConfig,
  step: 1 | 2 | 3,
  draft: VerificationDraft
) {
  const fields = customFieldsForStep(config, step);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((draft.customAnswers ?? []).map((a) => [a.fieldKey, a.value]))
  );

  function setValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function missingRequiredLabels(): string[] {
    return fields
      .filter((f) => f.required && !(values[f.key] ?? "").trim())
      .map((f) => f.label);
  }

  function payload(): Record<string, string> {
    return Object.fromEntries(fields.map((f) => [f.key, (values[f.key] ?? "").trim()]));
  }

  return { fields, values, setValue, missingRequiredLabels, payload };
}
