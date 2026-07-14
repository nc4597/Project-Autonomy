function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v4.5M10 6.75h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Boxed regulatory/compliance disclosure text (Bank Secrecy Act notices,
// federal-crime certification language, etc.) — visually distinct from
// both plain body copy and form validation errors.
export function ComplianceNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border border-warning-text/20 bg-warning-bg px-5 py-4 text-sm text-warning-text">
      <InfoIcon />
      <div>{children}</div>
    </div>
  );
}
