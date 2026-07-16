import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Cta() {
  return (
    <section className="bg-card py-24">
      <Container className="text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <span className="h-0.5 w-8 bg-brand-red" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-red">
            Join the Network
          </span>
        </div>
        <h2 className="mx-auto mb-6 max-w-[620px] font-serif text-4xl font-semibold leading-[1.2] text-ink md:text-5xl">
          Ready to Access Private Markets?
        </h2>
        <p className="mx-auto mb-10 max-w-[540px] text-[15px] leading-relaxed text-ink-secondary">
          Regiment Marketplace is available exclusively to accredited
          investors. Complete your verification to unlock full access to
          active offerings and deal materials.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button href="/verify" variant="primary" className="px-[26px] py-3.5">
            Become an Investor
          </Button>
          <Button href="/deals" variant="secondary" className="px-[26px] py-3.5">
            Browse Marketplace
          </Button>
        </div>
      </Container>
    </section>
  );
}
