"use client";

export interface LabelValueItem {
  id?: string;
  label: string;
  value: string;
}

// Powers both Investment Snapshot and Market Opportunity's stat cards —
// an admin-defined list of arbitrary label/value pairs, add/remove/
// reorder freely, no fixed set of fields.
export function LabelValueListField({
  items,
  onChange,
  labelPlaceholder = "Field name",
  valuePlaceholder = "Value",
  addLabel = "Add Field",
}: {
  items: LabelValueItem[];
  onChange: (items: LabelValueItem[]) => void;
  labelPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
}) {
  function update(index: number, patch: Partial<LabelValueItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id ?? index} className="flex items-center gap-2">
            <input
              value={item.label}
              onChange={(e) => update(index, { label: e.target.value })}
              placeholder={labelPlaceholder}
              className="w-1/2 border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
            <input
              value={item.value}
              onChange={(e) => update(index, { value: e.target.value })}
              placeholder={valuePlaceholder}
              className="w-1/2 border border-hairline bg-page px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="px-1 text-ink-muted hover:text-ink disabled:opacity-30"
                aria-label="Move up"
              >
                &uarr;
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                className="px-1 text-ink-muted hover:text-ink disabled:opacity-30"
                aria-label="Move down"
              >
                &darr;
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                className="px-1 text-brand-red hover:text-brand-red-dark"
                aria-label="Remove"
              >
                &times;
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { label: "", value: "" }])}
        className="mt-3 border border-navy-950 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-navy-950 hover:bg-navy-950/5"
      >
        + {addLabel}
      </button>
    </div>
  );
}
