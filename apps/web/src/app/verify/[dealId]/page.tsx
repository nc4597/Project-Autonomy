"use client";

import { useVerificationDraft } from "../../../lib/hooks/useVerificationDraft";
import { useVerificationStore } from "../../../lib/state/verificationStore";
import { useFormConfig } from "../../../lib/hooks/useFormConfig";
import { buildWizardSequence } from "../../../lib/verification/formConfig";
import { WizardStepper } from "../../../components/verification/WizardStepper";
import { SubmittedView } from "../../../components/verification/SubmittedView";
import { ResumeChallengeCard } from "../../../components/verification/ResumeChallengeCard";
import { Step1ContactInfo } from "../../../components/verification/steps/Step1ContactInfo";
import { Step2KycAml } from "../../../components/verification/steps/Step2KycAml";
import { Step3Accreditation } from "../../../components/verification/steps/Step3Accreditation";
import { StepCustomPage } from "../../../components/verification/steps/StepCustomPage";
import { Step4Review } from "../../../components/verification/steps/Step4Review";
import { Container } from "../../../components/ui/Container";

function VerificationHero() {
  return (
    <div className="bg-navy-950 py-14 text-white">
      <Container>
        <div className="mb-4 flex items-center gap-2">
          <span className="h-px w-8 bg-brand-red" />
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
            Investor Verification
          </span>
        </div>
        <h1 className="font-serif text-4xl font-bold sm:text-5xl">Accredited Investor Verification</h1>
        <p className="mt-4 max-w-2xl text-white/70">
          Complete your verification to access Regiment Express offerings. Documents are encrypted
          and handled by our FINRA-compliant compliance team.
        </p>
      </Container>
    </div>
  );
}

export default function VerifyPage({ params }: { params: { dealId: string } }) {
  const { dealId } = params;
  const { submissionId, draft, isLoading, error, refresh, challengeId, submitChallenge } =
    useVerificationDraft(dealId);
  const currentStep = useVerificationStore((s) => s.currentStep);
  const setCurrentStep = useVerificationStore((s) => s.setCurrentStep);
  const config = useFormConfig();

  // The wizard's order comes from the published config: core steps with
  // admin-defined pages wherever they were placed, Review always last.
  const sequence = buildWizardSequence(config);
  const coreLabels = { 1: "Contact Information", 2: "KYC / AML", 3: "Accredited Investor" } as const;
  const stepDefs = sequence.map((entry) => ({
    step: entry.number,
    label:
      entry.kind === "core"
        ? coreLabels[entry.coreStep]
        : entry.kind === "page"
          ? entry.page.title
          : "Review & Submit",
  }));
  // Clamp so a resume point saved under an older, longer wizard still
  // lands on a real step.
  const entry = sequence[Math.min(Math.max(currentStep, 1), sequence.length) - 1];

  if (challengeId) {
    return (
      <div>
        <VerificationHero />
        <Container className="py-10">
          <ResumeChallengeCard onSubmit={submitChallenge} />
        </Container>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Container className="py-16 text-center text-sm text-ink-secondary">
        Loading your verification...
      </Container>
    );
  }

  if (error || !submissionId || !draft) {
    return (
      <Container className="py-16 text-center text-sm text-brand-red">
        {error ?? "Something went wrong loading this verification."}
      </Container>
    );
  }

  if (draft.status === "SUBMITTED") {
    return <SubmittedView firstName={draft.contactInfo?.firstName ?? "Investor"} />;
  }

  async function handleSaved() {
    await refresh();
  }

  return (
    <div>
      <VerificationHero />
      <WizardStepper currentStep={entry.number} steps={stepDefs} />
      <Container className="py-10">
        {entry.kind === "core" && entry.coreStep === 1 && (
          <Step1ContactInfo
            submissionId={submissionId}
            draft={draft}
            dealHref={`/deals/${dealId}`}
            onSaved={handleSaved}
          />
        )}
        {entry.kind === "core" && entry.coreStep === 2 && (
          <Step2KycAml
            submissionId={submissionId}
            draft={draft}
            onSaved={handleSaved}
            onBack={() => setCurrentStep(entry.number - 1)}
          />
        )}
        {entry.kind === "core" && entry.coreStep === 3 && (
          <Step3Accreditation
            submissionId={submissionId}
            draft={draft}
            onSaved={handleSaved}
            onBack={() => setCurrentStep(entry.number - 1)}
          />
        )}
        {entry.kind === "page" && (
          <StepCustomPage
            key={entry.page.key}
            submissionId={submissionId}
            page={entry.page}
            config={config}
            stepNumber={entry.number}
            draft={draft}
            onSaved={handleSaved}
            onBack={() => setCurrentStep(entry.number - 1)}
          />
        )}
        {entry.kind === "review" && (
          <Step4Review
            submissionId={submissionId}
            draft={draft}
            onBack={() => setCurrentStep(entry.number - 1)}
            onEditStep={(step) => setCurrentStep(step)}
            onSubmitted={handleSaved}
          />
        )}
      </Container>
    </div>
  );
}
