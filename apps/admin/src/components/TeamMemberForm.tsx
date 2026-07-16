"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ImageUploadField } from "./ImageUploadField";

// Same error-shape handling as DealForm.tsx's extractErrorMessage.
function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const flat = error as { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
    if (flat.formErrors?.[0]) return flat.formErrors[0];
    const firstFieldError = Object.values(flat.fieldErrors ?? {}).find((msgs) => msgs?.[0]);
    if (firstFieldError?.[0]) return firstFieldError[0];
  }
  return "Could not save team member";
}

export interface TeamMemberFormValues {
  name: string;
  title: string;
  bio: string;
  photoUrl: string | null;
  sortOrder: number;
}

export const emptyTeamMemberForm: TeamMemberFormValues = {
  name: "",
  title: "",
  bio: "",
  photoUrl: null,
  sortOrder: 0,
};

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
      />
    </div>
  );
}

export function TeamMemberForm({
  mode,
  teamMemberId,
  initialValues,
}: {
  mode: "create" | "edit";
  teamMemberId?: string;
  initialValues?: TeamMemberFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<TeamMemberFormValues>(initialValues ?? emptyTeamMemberForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof TeamMemberFormValues>(key: K, value: TeamMemberFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(mode === "create" ? "/api/team" : `/api/team/${teamMemberId}`, {
      method: mode === "create" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(extractErrorMessage(body?.error));
      return;
    }

    router.push("/team");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      <section className="border border-hairline bg-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Name" value={values.name} onChange={(v) => set("name", v)} placeholder="e.g. Sarah Chen" />
          <TextField
            label="Title"
            value={values.title}
            onChange={(v) => set("title", v)}
            placeholder="e.g. Head of Investor Relations"
          />
        </div>

        <div className="mt-4">
          <label htmlFor="bio" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Short Bio
          </label>
          <textarea
            id="bio"
            value={values.bio}
            onChange={(e) => set("bio", e.target.value)}
            rows={3}
            className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <ImageUploadField
            label="Photo"
            kind="team"
            value={values.photoUrl}
            onChange={(url) => set("photoUrl", url)}
          />
        </div>

        <div className="mt-4 max-w-[160px]">
          <label
            htmlFor="sort-order"
            className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary"
          >
            Display Order
          </label>
          <input
            id="sort-order"
            type="number"
            value={values.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
            className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
          />
        </div>
      </section>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-red-dark disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Team Member"}
      </button>
    </form>
  );
}
