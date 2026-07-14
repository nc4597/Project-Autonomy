export function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hairline py-3 last:border-0">
      <span className="text-sm text-ink-secondary">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
