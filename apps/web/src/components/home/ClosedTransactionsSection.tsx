import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TombstoneCard } from "@/components/deals/TombstoneCard";
import type { Deal } from "@/lib/marketplace/types";

export function ClosedTransactionsSection({ deals }: { deals: Deal[] }) {
  return (
    <section className="bg-page py-24">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel>Track Record</SectionLabel>
            <h2 className="font-serif text-4xl text-ink">
              Recently Closed Transactions
            </h2>
          </div>
          <Button href="/deals?status=closed" variant="secondary">
            View All Transactions
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {deals.map((deal) => (
            <TombstoneCard key={deal.slug} deal={deal} />
          ))}
        </div>
      </Container>
    </section>
  );
}
