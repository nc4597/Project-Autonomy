"use client";

import { ImageUploadField } from "./ImageUploadField";

export interface LeadershipItem {
  id?: string;
  name: string;
  title: string;
  bio: string;
  photoUrl?: string | null;
}

export function LeadershipListField({
  items,
  onChange,
}: {
  items: LeadershipItem[];
  onChange: (items: LeadershipItem[]) => void;
}) {
  function update(index: number, patch: Partial<LeadershipItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id ?? index} className="border border-hairline bg-page p-5">
            <div className="mb-4 flex items-start gap-4">
              <ImageUploadField
                label="Photo"
                kind="leadership"
                value={item.photoUrl}
                onChange={(url) => update(index, { photoUrl: url })}
              />
              <div className="flex-1 space-y-3">
                <input
                  value={item.name}
                  onChange={(e) => update(index, { name: e.target.value })}
                  placeholder="Name"
                  className="w-full border border-hairline bg-card px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
                />
                <input
                  value={item.title}
                  onChange={(e) => update(index, { title: e.target.value })}
                  placeholder="Title"
                  className="w-full border border-hairline bg-card px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
                />
              </div>
            </div>
            <textarea
              value={item.bio}
              onChange={(e) => update(index, { bio: e.target.value })}
              placeholder="Bio"
              rows={2}
              className="w-full border border-hairline bg-card px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-3 text-xs text-brand-red hover:underline"
            >
              Remove team member
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { name: "", title: "", bio: "", photoUrl: null }])}
        className="mt-4 border border-navy-950 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-navy-950 hover:bg-navy-950/5"
      >
        + Add Team Member
      </button>
    </div>
  );
}
