import type { ReactNode } from "react";

export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: "live" | "success" | "navy" | "neutral";
}) {
  const variantClasses = {
    live: "bg-brand-red text-white",
    success: "bg-success text-white",
    navy: "bg-navy-900 text-white",
    neutral: "border border-hairline bg-card text-ink-secondary",
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${variantClasses}`}
    >
      {children}
    </span>
  );
}
