import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FeaturedDealCard } from "@/components/deals/FeaturedDealCard";
import type { Deal } from "@/lib/marketplace/types";

export function FeaturedDealSection({ deal }: { deal: Deal }) {
  return (
    <section className="bg-page py-24">
      <Container>
        <div className="mb-10 flex items-end justify-between">
          <div>
            <SectionLabel>Featured Investment</SectionLabel>
            <h2 className="font-serif text-4xl text-ink">Current Offering</h2>
          </div>
          <Link
            href="/deals"
            className="hidden text-sm font-semibold uppercase tracking-[0.08em] text-ink-secondary transition-colors hover:text-ink md:inline-flex md:items-center md:gap-1"
          >
            All Deals <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
        <FeaturedDealCard deal={deal} />
      </Container>
    </section>
  );
}
