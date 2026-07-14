import { Button } from "../ui/Button";

export function WizardCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-hairline bg-card p-8 sm:p-10">
      <h2 className="font-serif text-2xl font-bold text-ink">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-sm text-ink-secondary">{description}</p>}
      <div className="mt-8 space-y-8">{children}</div>
    </div>
  );
}

export function WizardFooterNav({
  onBack,
  backLabel = "Previous",
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  isSubmitting = false,
}: {
  onBack?: () => void;
  backLabel?: string;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  isSubmitting?: boolean;
}) {
  return (
    <div className="mt-10 flex items-center justify-between border-t border-hairline pt-6">
      {onBack ? (
        <Button variant="secondary" onClick={onBack}>
          &larr; {backLabel}
        </Button>
      ) : (
        <span />
      )}
      <Button variant="primary" onClick={onContinue} disabled={continueDisabled || isSubmitting}>
        {isSubmitting ? "Submitting..." : continueLabel}{" "}
        {continueLabel !== "Submit Verification" && "→"}
      </Button>
    </div>
  );
}
