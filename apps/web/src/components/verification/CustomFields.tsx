"use client";

import { Field, Select, TextInput } from "../ui/Field";
import { visibleOptions, type FormField } from "../../lib/verification/formConfig";

/**
 * Admin-defined custom fields for one wizard step. Values are display
 * strings keyed by the config field's stable key; the step component
 * owns the state and sends them along with its PATCH.
 */
export function CustomFields({
  fields,
  values,
  onChange,
}: {
  fields: FormField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (fields.length === 0) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {fields.map((field) => {
        const label = field.required ? field.label : `${field.label} (optional)`;
        const value = values[field.key] ?? "";
        return (
          <div key={field.key}>
            <Field label={label}>
              {field.type === "DROPDOWN" ? (
                <Select value={value} onChange={(e) => onChange(field.key, e.target.value)}>
                  <option value="">Select...</option>
                  {visibleOptions(field).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              ) : field.type === "YES_NO" ? (
                <Select value={value} onChange={(e) => onChange(field.key, e.target.value)}>
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </Select>
              ) : (
                <TextInput
                  type={field.type === "DATE" ? "date" : "text"}
                  value={value}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              )}
            </Field>
            {field.helpText && <p className="mt-1 text-xs text-ink-muted">{field.helpText}</p>}
          </div>
        );
      })}
    </div>
  );
}
