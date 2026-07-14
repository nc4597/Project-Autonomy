export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-[3px] w-full bg-hairline">
      <div
        className="h-full bg-brand-red"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
