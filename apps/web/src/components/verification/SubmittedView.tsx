import { Container } from "../ui/Container";
import { Button } from "../ui/Button";

type StepState = "complete" | "active" | "upcoming";

const NEXT_STEPS: { title: string; description: string; state: StepState }[] = [
  {
    title: "Submission Received",
    description: "Your documents and information have been received by Regiment Securities.",
    state: "complete",
  },
  {
    title: "Compliance Review",
    description: "Our compliance team reviews all submitted documents within 1–2 business days.",
    state: "active",
  },
  {
    title: "Approval",
    description: "You will receive an email notification once your verification is approved.",
    state: "upcoming",
  },
  {
    title: "Representative Contact",
    description: "Your assigned Regiment representative will contact you to discuss the offering.",
    state: "upcoming",
  },
  {
    title: "Documents & Funding",
    description: "Review subscription documents and complete your investment through your representative.",
    state: "upcoming",
  },
];

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepBadge({ state }: { state: StepState }) {
  if (state === "complete") {
    return (
      <span className="bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
        Complete
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="bg-brand-red/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-red">
        In Progress
      </span>
    );
  }
  return null;
}

export function SubmittedView({ firstName }: { firstName: string }) {
  return (
    <div className="bg-page py-16">
      <Container>
        <div className="mx-auto max-w-2xl border border-hairline bg-card p-10 text-center">
          <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckIcon className="h-5 w-5" />
          </div>
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-brand-red" />
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
              Verification Submitted
            </span>
          </div>
          <h2 className="font-serif text-3xl font-bold text-ink">Thank You, {firstName}.</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
            Your verification has been submitted to Regiment&rsquo;s compliance team. We will review your
            documents and a Regiment representative will contact you within{" "}
            <strong className="font-semibold text-ink">1&ndash;2 business days</strong> after approval.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="dark" href="/">
              Return to Marketplace
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-2xl border border-hairline bg-card p-10">
          <h3 className="font-serif text-xl font-bold text-ink">What Happens Next</h3>
          <ol className="mt-6">
            {NEXT_STEPS.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 pb-6 last:pb-0">
                {index < NEXT_STEPS.length - 1 && (
                  <span className="absolute bottom-0 left-3.5 top-7 w-px bg-hairline" aria-hidden="true" />
                )}
                <span
                  className={[
                    "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center text-xs font-bold",
                    step.state === "complete"
                      ? "bg-navy-950 text-white"
                      : step.state === "active"
                        ? "bg-brand-red text-white"
                        : "border border-hairline bg-card text-ink-muted",
                  ].join(" ")}
                >
                  {step.state === "complete" ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{step.title}</span>
                    <StepBadge state={step.state} />
                  </div>
                  <p className="mt-1 text-sm text-ink-secondary">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mx-auto mt-8 max-w-2xl bg-navy-950 px-8 py-6 text-center">
          <p className="text-sm text-white/80">
            Questions while your verification is under review? Contact us at{" "}
            <a href="mailto:ir@regimentsecurities.com" className="text-white underline">
              ir@regimentsecurities.com
            </a>{" "}
            or call <span className="text-white">(212) 555-0100</span> Mon&ndash;Fri, 9am&ndash;6pm EST.
          </p>
        </div>
      </Container>
    </div>
  );
}
