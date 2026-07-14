import { Container } from "@/components/ui/Container";

const steps = [
  {
    number: "01",
    title: "Discover",
    description: "Browse curated private offerings in the Regiment Marketplace",
  },
  {
    number: "02",
    title: "Review",
    description:
      "Access the deal overview, teaser materials, and investment snapshot",
  },
  {
    number: "03",
    title: "Verify",
    description: "Complete accredited investor verification through our secure portal",
  },
  {
    number: "04",
    title: "Invest",
    description: "Your Regiment representative guides you through documents and funding",
  },
  {
    number: "05",
    title: "Stay Connected",
    description: "Receive regular updates from the issuer and Regiment",
  },
];

export function ProcessTimeline() {
  return (
    <section className="bg-navy-950 py-24">
      <Container>
        <div className="mb-16 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-brand-red" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
              How It Works
            </span>
            <span className="h-px w-8 bg-brand-red" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-4xl text-white">
            The Investment Process
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5 md:gap-4">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-brand-red/50">
                <span className="font-serif text-xl text-brand-red">
                  {step.number}
                </span>
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/50">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
