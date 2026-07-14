export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const rounded = Number.isInteger(millions)
      ? millions.toString()
      : millions.toFixed(1);
    return `$${rounded}M`;
  }
  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}K`;
  }
  return `$${value}`;
}

export function percentFunded(raised: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.round((raised / goal) * 100);
}
