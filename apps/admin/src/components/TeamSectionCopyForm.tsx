"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The About page's team-section heading and subtitle — lives on the
 * Team page next to the members it describes, saved through its own
 * endpoint so it can't collide with Home Settings.
 */
export function TeamSectionCopyForm({
  initialTitle,
  initialSubtitle,
}: {
  initialTitle: string;
  initialSubtitle: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [subtitle, setSubtitle] = useState(initialSubtitle);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(false);
    const res = await fetch("/api/team-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamSectionTitle: title, teamSectionSubtitle: subtitle }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    } else {
      setError(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 border border-hairline bg-card p-6">
      <h2 className="mb-4 font-serif text-xl text-ink">About Page — Team Section</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Section Title
          </label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaved(false);
            }}
            className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
            Subtitle
          </label>
          <input
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value);
              setSaved(false);
            }}
            className="w-full border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
          />
          <p className="mt-1 text-xs text-ink-muted">
            Shown under the title. Write {"{count}"} anywhere for the live number of team members,
            and {"[label](https://url)"} for a link. Leave empty to show no subtitle.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving || title.trim().length === 0}
            className="bg-navy-950 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save Copy"}
          </button>
          {saved && <span className="text-xs font-semibold text-success">Saved</span>}
          {error && <span className="text-xs font-semibold text-brand-red">Failed to save — try again</span>}
        </div>
      </div>
    </form>
  );
}
