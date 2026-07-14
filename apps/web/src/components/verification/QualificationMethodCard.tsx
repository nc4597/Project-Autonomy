export function QualificationMethodCard({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex w-full items-start gap-3 border px-5 py-4 text-left transition-colors",
        selected ? "border-navy-950 bg-page" : "border-hairline bg-card hover:border-navy-800",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
          selected ? "border-brand-red bg-brand-red" : "border-hairline bg-card",
        ].join(" ")}
      >
        {selected && (
          <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3">
            <path d="M3 8.5L6.5 12L13 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-sm text-ink-secondary">{description}</span>
      </span>
    </button>
  );
}
