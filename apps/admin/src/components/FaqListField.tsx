"use client";

export interface FaqItem {
  id?: string;
  question: string;
  answer: string;
}

export function FaqListField({
  items,
  onChange,
}: {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}) {
  function update(index: number, patch: Partial<FaqItem>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id ?? index} className="border border-hairline bg-page p-5">
            <input
              value={item.question}
              onChange={(e) => update(index, { question: e.target.value })}
              placeholder="Question"
              className="mb-2 w-full border border-hairline bg-card px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
            <textarea
              value={item.answer}
              onChange={(e) => update(index, { answer: e.target.value })}
              placeholder="Answer"
              rows={2}
              className="w-full border border-hairline bg-card px-3 py-2 text-sm text-ink focus:border-navy-800 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-2 text-xs text-brand-red hover:underline"
            >
              Remove question
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...items, { question: "", answer: "" }])}
        className="mt-4 border border-navy-950 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-navy-950 hover:bg-navy-950/5"
      >
        + Add Question
      </button>
    </div>
  );
}
