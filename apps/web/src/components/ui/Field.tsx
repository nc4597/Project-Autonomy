import { forwardRef } from "react";

const CONTROL_CLASSES =
  "w-full border border-hairline bg-card px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-navy-950 focus:outline-none";

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-brand-red">{error}</span>}
    </label>
  );
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = "", ...props }, ref) {
    return <input ref={ref} {...props} className={`${CONTROL_CLASSES} ${className}`} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...props }, ref) {
    return (
      <select ref={ref} {...props} className={`${CONTROL_CLASSES} ${className}`}>
        {children}
      </select>
    );
  }
);
