"use client";

import { useVerificationDraft } from "../../../lib/hooks/useVerificationDraft";
import { useVerificationStore } from "../../../lib/state/verificationStore";
import { WizardStepper } from "../../../components/verification/WizardStepper";
import { Step1ContactInfo } from "../../../components/verification/steps/Step1ContactInfo";
import { Step2KycAml } from "../../../components/verification/steps/Step2KycAml";
import { Step3Accreditation } from "../../../components/verification/steps/Step3Accreditation";
import { Step4Review } from "../../../components/verification/steps/Step4Review";
import { Container } from "../../../components/ui/Container";

export default function VerifyPage({ params }: { params: { dealId: string } }) {
  const { dealId } = params;
  const { submissionId, draft, isLoading, error, refresh } = useVerificationDraft(dealId);
  const currentStep = useVerificationStore((s) => s.currentStep);
  const setCurrentStep = useVerificationStore((s) => s.setCurrentStep);

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
    return (
      <Container className="py-16">
        <div className="mx-auto max-w-xl border border-hairline bg-card p-10 text-center">
          <h2 className="font-serif text-2xl font-bold text-ink">Verification Submitted</h2>
          <p className="mt-3 text-sm text-ink-secondary">
            Thank you. Our compliance team will review your submission and follow up by email once your
            accredited investor status has been confirmed.
          </p>
        </div>
      </Container>
    );
  }

  async function handleSaved() {
    await refresh();
  }

  return (
    <div>
      <WizardStepper currentStep={currentStep} />
      <Container className="py-10">
        {currentStep === 1 && (
          <Step1ContactInfo
            submissionId={submissionId}
            draft={draft}
            dealHref={`/deals/${dealId}`}
            onSaved={handleSaved}
          />
        )}
        {currentStep === 2 && (
          <Step2KycAml
            submissionId={submissionId}
            draft={draft}
            onSaved={handleSaved}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && (
          <Step3Accreditation
            submissionId={submissionId}
            draft={draft}
            onSaved={handleSaved}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && (
          <Step4Review
            submissionId={submissionId}
            draft={draft}
            onBack={() => setCurrentStep(3)}
            onEditStep={(step) => setCurrentStep(step)}
            onSubmitted={handleSaved}
          />
        )}
      </Container>
    </div>
  );
}
