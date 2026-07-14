import { Container } from "@/components/ui/Container";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { FaqItem } from "@/lib/marketplace/types";

export function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section className="bg-page py-24">
      <Container>
        <div className="mb-10">
          <SectionLabel>Questions</SectionLabel>
          <h2 className="font-serif text-4xl text-ink">
            Frequently Asked Questions
          </h2>
        </div>
        <FaqAccordion items={items} />
      </Container>
    </section>
  );
}
