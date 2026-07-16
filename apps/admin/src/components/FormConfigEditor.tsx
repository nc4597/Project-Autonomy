"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FIELD_TYPES,
  FIELD_TYPE_LABELS,
  validateDraftAgainstCore,
  type FieldType,
  type FormField,
  type VerificationFormConfig,
} from "@/lib/kyc/formConfigShared";

const STEP_TABS = [
  { step: 1 as const, label: "Step 1 · Contact Info" },
  { step: 2 as const, label: "Step 2 · KYC / AML" },
  { step: 3 as const, label: "Step 3 · Accreditation" },
  { step: 4 as const, label: "Step 4 · Certification" },
];

function newFieldKey() {
  return `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function FormConfigEditor() {
  const [config, setConfig] = useState<VerificationFormConfig | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [hasUnpublished, setHasUnpublished] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newField, setNewField] = useState<{
    label: string;
    type: FieldType;
    required: boolean;
    helpText: string;
    optionsText: string;
  }>({ label: "", type: "SHORT_TEXT", required: false, helpText: "", optionsText: "" });

  useEffect(() => {
    fetch("/api/form-config")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Failed to load form config (${res.status})`);
        return res.json();
      })
      .then((state) => {
        setConfig(state.draft);
        setPublishedAt(state.publishedAt);
        setHasUnpublished(state.hasUnpublishedChanges);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  const stepFields = useMemo(
    () => (config && activeStep !== 4 ? config.fields.filter((f) => f.step === activeStep) : []),
    [config, activeStep]
  );

  function mutate(updater: (draft: VerificationFormConfig) => VerificationFormConfig) {
    setConfig((current) => (current ? updater(current) : current));
    setDirty(true);
    setError(null);
  }

  function updateField(key: string, patch: Partial<FormField>) {
    mutate((draft) => ({
      ...draft,
      fields: draft.fields.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    }));
  }

  function moveField(key: string, direction: -1 | 1) {
    mutate((draft) => {
      const fields = [...draft.fields];
      const index = fields.findIndex((f) => f.key === key);
      const target = index + direction;
      if (
        index === -1 ||
        target < 0 ||
        target >= fields.length ||
        fields[target].step !== fields[index].step
      ) {
        return draft;
      }
      [fields[index], fields[target]] = [fields[target], fields[index]];
      return { ...draft, fields };
    });
  }

  function removeField(key: string) {
    mutate((draft) => ({ ...draft, fields: draft.fields.filter((f) => f.key !== key) }));
  }

  function addCustomField() {
    if (!newField.label.trim() || activeStep === 4) return;
    const options =
      newField.type === "DROPDOWN"
        ? newField.optionsText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((label) => ({ value: label, label }))
        : undefined;
    if (newField.type === "DROPDOWN" && (!options || options.length === 0)) {
      setError("Add at least one dropdown option (one per line).");
      return;
    }
    const field: FormField = {
      key: newFieldKey(),
      step: activeStep,
      label: newField.label.trim(),
      helpText: newField.helpText.trim() || undefined,
      type: newField.type,
      required: newField.required,
      core: false,
      options,
    };
    mutate((draft) => {
      const fields = [...draft.fields];
      let insertAt = fields.length;
      for (let i = fields.length - 1; i >= 0; i--) {
        if (fields[i].step === activeStep) {
          insertAt = i + 1;
          break;
        }
      }
      fields.splice(insertAt, 0, field);
      return { ...draft, fields };
    });
    setNewField({ label: "", type: "SHORT_TEXT", required: false, helpText: "", optionsText: "" });
    setAdding(false);
  }

  async function persist(publish: boolean) {
    if (!config) return;
    // Drop option rows that were added but never filled in.
    const sanitized: VerificationFormConfig = {
      ...config,
      fields: config.fields.map((f) =>
        f.type === "DROPDOWN"
          ? { ...f, options: (f.options ?? []).filter((o) => o.label.trim().length > 0) }
          : f
      ),
    };
    const coreViolation = validateDraftAgainstCore(sanitized);
    if (coreViolation) {
      setError(coreViolation);
      return;
    }
    setBusy(publish ? "publish" : "save");
    setError(null);
    try {
      const saveRes = await fetch("/api/form-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized),
      });
      if (!saveRes.ok) {
        const body = await saveRes.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Failed to save draft");
      }
      let state = await saveRes.json();
      if (publish) {
        const pubRes = await fetch("/api/form-config/publish", { method: "POST" });
        if (!pubRes.ok) throw new Error("Draft saved, but publishing failed");
        state = await pubRes.json();
      }
      setConfig(state.draft);
      setPublishedAt(state.publishedAt);
      setHasUnpublished(state.hasUnpublishedChanges);
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  if (loadError) {
    return (
      <div className="border border-warning-text/20 bg-warning-bg px-5 py-4 text-sm text-warning-text">
        {loadError}
      </div>
    );
  }
  if (!config) {
    return <p className="text-sm text-ink-secondary">Loading form configuration…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-1 border-b border-hairline">
          {STEP_TABS.map((tab) => (
            <button
              key={tab.step}
              type="button"
              onClick={() => {
                setActiveStep(tab.step);
                setEditingKey(null);
                setAdding(false);
              }}
              className={`border border-b-0 px-4 py-2.5 text-xs font-semibold ${
                activeStep === tab.step
                  ? "-mb-px border-hairline bg-card text-ink"
                  : "border-transparent text-ink-secondary hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-ink-muted">
            {dirty
              ? "Unsaved edits"
              : hasUnpublished
                ? "Draft saved — not yet published"
                : publishedAt
                  ? `Published ${new Date(publishedAt).toLocaleString()}`
                  : "Never published"}
          </span>
          <button
            type="button"
            onClick={() => persist(false)}
            disabled={busy !== null}
            className="border border-navy-950 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-navy-950 disabled:opacity-40"
          >
            {busy === "save" ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => persist(true)}
            disabled={busy !== null}
            className="bg-brand-red px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-red-dark disabled:opacity-40"
          >
            {busy === "publish" ? "Publishing…" : "Publish Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 border border-brand-red/30 bg-brand-red/5 px-4 py-3 text-sm text-brand-red">
          {error}
        </div>
      )}

      {activeStep === 4 ? (
        <div className="max-w-3xl border border-hairline bg-card p-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Certification Statement
          </label>
          <p className="mb-3 text-xs text-ink-muted">
            Shown next to the checkbox investors must accept before submitting.
          </p>
          <textarea
            value={config.certificationText}
            onChange={(e) => mutate((d) => ({ ...d, certificationText: e.target.value }))}
            rows={5}
            className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="border border-hairline bg-card">
              {stepFields.map((field, index) => {
                const isEditing = editingKey === field.key;
                const prevSameStep = index > 0;
                const nextSameStep = index < stepFields.length - 1;
                return (
                  <div key={field.key} className="border-b border-hairline last:border-b-0">
                    <div className={`flex items-center gap-3 px-4 py-3.5 ${isEditing ? "bg-page" : ""}`}>
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={!prevSameStep}
                          onClick={() => moveField(field.key, -1)}
                          className="text-[10px] leading-none text-ink-muted disabled:opacity-25"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={!nextSameStep}
                          onClick={() => moveField(field.key, 1)}
                          className="text-[10px] leading-none text-ink-muted disabled:opacity-25"
                        >
                          ▼
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-ink">{field.label}</p>
                        <p className="text-xs text-ink-muted">
                          {FIELD_TYPE_LABELS[field.type]}
                          {field.type === "DROPDOWN" &&
                            ` · ${(field.options ?? []).filter((o) => !o.hidden).length} options`}
                          {" · "}
                          {field.required ? "Required" : "Optional"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          field.core
                            ? "border border-hairline bg-page text-ink-secondary"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {field.core ? "Core" : "Custom"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingKey(isEditing ? null : field.key)}
                        className="border border-hairline px-3 py-1.5 text-xs font-semibold text-ink"
                      >
                        {isEditing ? "Close" : "Edit"}
                      </button>
                      {!field.core && (
                        <button
                          type="button"
                          onClick={() => removeField(field.key)}
                          className="border border-hairline px-3 py-1.5 text-xs font-semibold text-brand-red"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {isEditing && (
                      <div className="space-y-4 border-t border-hairline bg-page px-5 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                              Label
                            </label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(field.key, { label: e.target.value })}
                              className="w-full border border-hairline bg-card px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                              Help text (optional)
                            </label>
                            <input
                              type="text"
                              value={field.helpText ?? ""}
                              onChange={(e) =>
                                updateField(field.key, { helpText: e.target.value || undefined })
                              }
                              className="w-full border border-hairline bg-card px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            checked={field.required}
                            disabled={field.core}
                            onChange={(e) => updateField(field.key, { required: e.target.checked })}
                          />
                          Required
                          {field.core && (
                            <span className="text-xs text-ink-muted">
                              (core fields stay required — compliance depends on them)
                            </span>
                          )}
                        </label>

                        {field.type === "DROPDOWN" && (
                          <div>
                            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                              Options
                            </label>
                            <div className="space-y-2">
                              {(field.options ?? []).map((option, optIndex) => (
                                <div key={`${field.key}-${optIndex}`} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={option.label}
                                    onChange={(e) => {
                                      const options = [...(field.options ?? [])];
                                      options[optIndex] = {
                                        ...options[optIndex],
                                        label: e.target.value,
                                        // Non-locked dropdowns store the label as the value.
                                        ...(field.optionsLocked ? {} : { value: e.target.value }),
                                      };
                                      updateField(field.key, { options });
                                    }}
                                    className={`w-72 border border-hairline bg-card px-3 py-1.5 text-sm text-ink focus:border-navy-800 focus:outline-none ${
                                      option.hidden ? "opacity-50" : ""
                                    }`}
                                  />
                                  {field.core || field.optionsLocked ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const options = [...(field.options ?? [])];
                                        options[optIndex] = {
                                          ...options[optIndex],
                                          hidden: !options[optIndex].hidden,
                                        };
                                        updateField(field.key, { options });
                                      }}
                                      className="border border-hairline px-2.5 py-1 text-xs font-semibold text-ink-secondary"
                                    >
                                      {option.hidden ? "Show" : "Hide"}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const options = (field.options ?? []).filter(
                                          (_, i) => i !== optIndex
                                        );
                                        updateField(field.key, { options });
                                      }}
                                      className="border border-hairline px-2.5 py-1 text-xs font-semibold text-brand-red"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {!field.optionsLocked ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const options = [...(field.options ?? []), { value: "", label: "" }];
                                  updateField(field.key, { options });
                                }}
                                className="mt-2 border border-dashed border-hairline px-3 py-1.5 text-xs font-semibold text-ink-secondary"
                              >
                                + Add option
                              </button>
                            ) : (
                              <p className="mt-2 text-xs text-ink-muted">
                                These options drive compliance logic (document requirements), so new
                                ones can't be added — but you can rename or hide them.
                              </p>
                            )}
                            {field.core && !field.optionsLocked && (
                              <p className="mt-2 text-xs text-ink-muted">
                                Hiding an option removes it from the form while keeping past
                                submissions that used it intact.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {adding ? (
              <div className="mt-4 space-y-4 border border-hairline bg-card p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Field label
                    </label>
                    <input
                      type="text"
                      value={newField.label}
                      onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                      placeholder="e.g. Expected Investment Amount"
                      className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Type
                    </label>
                    <select
                      value={newField.type}
                      onChange={(e) => setNewField({ ...newField, type: e.target.value as FieldType })}
                      className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {FIELD_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                    Help text (optional)
                  </label>
                  <input
                    type="text"
                    value={newField.helpText}
                    onChange={(e) => setNewField({ ...newField, helpText: e.target.value })}
                    className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
                  />
                </div>
                {newField.type === "DROPDOWN" && (
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Options — one per line
                    </label>
                    <textarea
                      value={newField.optionsText}
                      onChange={(e) => setNewField({ ...newField, optionsText: e.target.value })}
                      rows={4}
                      className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  />
                  Required
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={addCustomField}
                    className="bg-navy-950 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                  >
                    Add Field
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdding(false)}
                    className="border border-hairline px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-4 w-full border border-dashed border-ink-muted/40 px-4 py-3 text-sm font-semibold text-ink-secondary hover:text-ink"
              >
                + Add field to this step
              </button>
            )}
          </div>

          <div className="h-fit border border-hairline bg-card">
            <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                Investor Preview
              </span>
              <span className="text-[10px] font-bold text-success">● updates as you edit</span>
            </div>
            <div className="p-5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-red">
                Step {activeStep} of 4
              </p>
              {stepFields
                .filter((f) => f.type !== "DROPDOWN" || (f.options ?? []).some((o) => !o.hidden))
                .map((field) => (
                  <div key={field.key} className="mb-4">
                    <label className="mb-1 block text-xs font-semibold text-ink">
                      {field.label}
                      {field.required && <span className="text-brand-red"> *</span>}
                    </label>
                    {field.type === "DROPDOWN" ? (
                      <div className="flex items-center justify-between border border-hairline bg-page px-3 py-2 text-sm text-ink-secondary">
                        {(field.options ?? []).find((o) => !o.hidden)?.label ?? "—"}
                        <span className="text-xs">▾</span>
                      </div>
                    ) : field.type === "YES_NO" ? (
                      <div className="flex gap-2">
                        <span className="border border-hairline bg-page px-4 py-2 text-sm text-ink-secondary">Yes</span>
                        <span className="border border-hairline bg-page px-4 py-2 text-sm text-ink-secondary">No</span>
                      </div>
                    ) : (
                      <div className="border border-hairline bg-page px-3 py-2 text-sm text-ink-muted">
                        {field.type === "DATE" ? "MM/DD/YYYY" : "Text"}
                      </div>
                    )}
                    {field.helpText && <p className="mt-1 text-[11px] text-ink-muted">{field.helpText}</p>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
