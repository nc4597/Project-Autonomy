import { Cta } from "@/components/home/Cta";
import { ClosedTransactionsSection } from "@/components/home/ClosedTransactionsSection";
import { FeaturedDealSection } from "@/components/home/FeaturedDealSection";
import { Hero } from "@/components/home/Hero";
import { KpiStrip } from "@/components/home/KpiStrip";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { WhyRegiment } from "@/components/home/WhyRegiment";
import { toCardDeal } from "@/lib/marketplace/adapters";
import { getDeals, getSiteSettings } from "@/lib/marketplace/adminClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, allDeals] = await Promise.all([getSiteSettings(), getDeals()]);

  const kpis = [
    { value: settings.capitalRaised, label: "Capital Raised" },
    { value: settings.completedTransactions, label: "Completed Transactions" },
    { value: settings.activeDeals, label: "Active Deals" },
    { value: settings.investorNetwork, label: "Investor Network" },
  ];

  const featuredDeal = settings.featuredDeal ? toCardDeal(settings.featuredDeal) : null;
  // Every closed transaction, newest close first — the carousel shows
  // them all, so this no longer depends on the hand-picked
  // featuredClosedDeals list in Home Settings.
  const closedDeals = allDeals
    .filter((deal) => deal.status === "CLOSED")
    .sort((a, b) => {
      const aTime = a.closeDate ? new Date(a.closeDate).getTime() : 0;
      const bTime = b.closeDate ? new Date(b.closeDate).getTime() : 0;
      return bTime - aTime;
    })
    .map(toCardDeal);

  return (
    <>
      <Hero />
      <KpiStrip kpis={kpis} />
      {featuredDeal && <FeaturedDealSection deal={featuredDeal} />}
      <WhyRegiment />
      {closedDeals.length > 0 && <ClosedTransactionsSection deals={closedDeals} />}
      <ProcessTimeline />
      <Cta />
    </>
  );
}
