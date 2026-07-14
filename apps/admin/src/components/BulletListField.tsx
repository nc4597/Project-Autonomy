"use client";

export interface BulletItem {
  id?: string;
  text: string;
}

export function BulletListField({
  items,
  onChange,
}: {
  items: BulletItem[];
  onChange: (items: BulletItem[]) => void;
}) {
  function update(index: number, text: string) {
    onChange(items.map((item, i) => (i === index ? { ...item, text } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id ?? index} className="flex items-center gap-2">
            <input
              value={item.text}
              onChange={(e) => update(index, e.target.value)}
              placeholder="Bullet point"
              className="flex-1 border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="px-1 text-brand-red hover:text-brand-red-dark"
              aria-label="Remove"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { text: "" }])}
        className="mt-3 border border-navy-950 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-navy-950 hover:bg-navy-950/5"
      >
        + Add Bullet
      </button>
    </div>
  );
}
