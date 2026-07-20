import { Container } from "@/components/ui/Container";

const steps = [
  {
    number: "01",
    title: "Discover",
    description: "Browse curated private offerings on Regiment Express",
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
        <div className="mb-3 flex items-center gap-3">
          <span className="h-0.5 w-8 bg-white" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white">
            How It Works
          </span>
        </div>
        <h2 className="mb-[72px] text-center font-serif text-4xl font-semibold text-white">
          The Investment Process
        </h2>

        <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-5 md:gap-6">
          <div
            className="absolute left-[10%] right-[10%] top-[26px] hidden h-px bg-white/40 md:block"
            aria-hidden="true"
          />
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="relative mx-auto mb-6 flex h-[52px] w-[52px] items-center justify-center border border-white/60 bg-navy-950">
                <span className="font-mono text-[13px] text-white">
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
