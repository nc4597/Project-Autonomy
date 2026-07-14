export function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="h-px w-8 bg-brand-red" aria-hidden="true" />
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
        {children}
      </span>
    </div>
  );
}
