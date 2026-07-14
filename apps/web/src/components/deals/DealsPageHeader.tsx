import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function DealsPageHeader() {
  return (
    <section className="bg-navy-950 py-20">
      <Container>
        <SectionLabel>Regiment Marketplace</SectionLabel>
        <h1 className="mb-4 font-serif text-5xl text-white">
          Private Investment Offerings
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-white/60">
          Curated private market opportunities available exclusively to
          accredited investors. All offerings are reviewed and facilitated by
          Regiment Securities LLC.
        </p>
      </Container>
    </section>
  );
}
