"use client";

import { useVerificationDraft } from "../../../lib/hooks/useVerificationDraft";
import { useVerificationStore } from "../../../lib/state/verificationStore";
import { useFormConfig } from "../../../lib/hooks/useFormConfig";
import { WizardStepper } from "../../../components/verification/WizardStepper";
import { SubmittedView } from "../../../components/verification/SubmittedView";
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
          Complete your verification to access Regiment Marketplace offerings. Documents are encrypted
          and handled by our FINRA-compliant compliance team.
        </p>
      </Container>
    </div>
  );
}

export default function VerifyPage({ params }: { params: { dealId: string } }) {
  const { dealId } = params;
  const { submissionId, draft, isLoading, error, refresh } = useVerificationDraft(dealId);
  const currentStep = useVerificationStore((s) => s.currentStep);
  const setCurrentStep = useVerificationStore((s) => s.setCurrentStep);
  const config = useFormConfig();

  // Wizard shape: 3 core steps, then admin-defined pages, then Review.
  const pages = config.customPages;
  const reviewStep = 4 + pages.length;
  const stepDefs = [
    { step: 1, label: "Contact Information" },
    { step: 2, label: "KYC / AML" },
    { step: 3, label: "Accredited Investor" },
    ...pages.map((page, index) => ({ step: 4 + index, label: page.title })),
    { step: reviewStep, label: "Review & Submit" },
  ];
  const activePage = currentStep >= 4 && currentStep < reviewStep ? pages[currentStep - 4] : null;

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
      <WizardStepper currentStep={currentStep} steps={stepDefs} />
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
        {activePage && (
          <StepCustomPage
            key={activePage.key}
            submissionId={submissionId}
            page={activePage}
            config={config}
            stepNumber={currentStep}
            draft={draft}
            onSaved={handleSaved}
            onBack={() => setCurrentStep(currentStep - 1)}
          />
        )}
        {currentStep >= reviewStep && (
          <Step4Review
            submissionId={submissionId}
            draft={draft}
            onBack={() => setCurrentStep(reviewStep - 1)}
            onEditStep={(step) => setCurrentStep(step)}
            onSubmitted={handleSaved}
          />
        )}
      </Container>
    </div>
  );
}
