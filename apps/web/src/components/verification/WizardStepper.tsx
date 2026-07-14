import { WIZARD_STEPS } from "../../lib/constants/verification";
import { Container } from "../ui/Container";

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3 8.5L6.5 12L13 4.5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="border-b border-hairline bg-card">
      <Container as="ol" className="flex flex-wrap items-center gap-x-2 gap-y-4 py-5">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = step.step < currentStep;
          const isActive = step.step === currentStep;

          return (
            <li key={step.step} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center text-xs font-semibold",
                    isCompleted
                      ? "bg-navy-950 text-white"
                      : isActive
                        ? "bg-brand-red text-white"
                        : "bg-page text-ink-muted",
                  ].join(" ")}
                >
                  {isCompleted ? <CheckIcon /> : step.step}
                </span>
                <span
                  className={[
                    "text-xs font-semibold uppercase tracking-wide",
                    isActive || isCompleted ? "text-ink" : "text-ink-muted",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
              {index < WIZARD_STEPS.length - 1 && (
                <span className="hidden h-px w-10 bg-hairline sm:block" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </Container>
    </div>
  );
}
