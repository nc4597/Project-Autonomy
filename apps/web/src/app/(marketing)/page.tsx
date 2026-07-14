import { Cta } from "@/components/home/Cta";
import { ClosedTransactionsSection } from "@/components/home/ClosedTransactionsSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FeaturedDealSection } from "@/components/home/FeaturedDealSection";
import { Hero } from "@/components/home/Hero";
import { KpiStrip } from "@/components/home/KpiStrip";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { WhyRegiment } from "@/components/home/WhyRegiment";
import {
  deals,
  featuredClosedDealSlugs,
  featuredDealSlug,
  homeFaqs,
  kpis,
} from "@/lib/marketplace/data";

export default function Home() {
  const featuredDeal = deals.find((deal) => deal.slug === featuredDealSlug)!;
  const closedDeals = featuredClosedDealSlugs
    .map((slug) => deals.find((deal) => deal.slug === slug))
    .filter((deal): deal is NonNullable<typeof deal> => Boolean(deal));

  return (
    <>
      <Hero />
      <KpiStrip kpis={kpis} />
      <FeaturedDealSection deal={featuredDeal} />
      <WhyRegiment />
      <ClosedTransactionsSection deals={closedDeals} />
      <ProcessTimeline />
      <Cta />
      <FaqSection items={homeFaqs} />
    </>
  );
}
