import { Cta } from "@/components/home/Cta";
import { ClosedTransactionsSection } from "@/components/home/ClosedTransactionsSection";
import { FeaturedDealSection } from "@/components/home/FeaturedDealSection";
import { Hero } from "@/components/home/Hero";
import { KpiStrip } from "@/components/home/KpiStrip";
import { ProcessTimeline } from "@/components/home/ProcessTimeline";
import { WhyRegiment } from "@/components/home/WhyRegiment";
import { toCardDeal } from "@/lib/marketplace/adapters";
import { getSiteSettings } from "@/lib/marketplace/adminClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSiteSettings();

  const kpis = [
    { value: settings.capitalRaised, label: "Capital Raised" },
    { value: settings.completedTransactions, label: "Completed Transactions" },
    { value: settings.activeDeals, label: "Active Deals" },
    { value: settings.investorNetwork, label: "Investor Network" },
  ];

  const featuredDeal = settings.featuredDeal ? toCardDeal(settings.featuredDeal) : null;
  const closedDeals = settings.featuredClosedDeals.map(toCardDeal);

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
