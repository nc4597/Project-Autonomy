import { getSiteSettings, listDeals } from "@/lib/dealRepository";
import { SiteSettingsForm } from "@/components/SiteSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, deals] = await Promise.all([getSiteSettings(), listDeals()]);

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl text-ink">Home Page Settings</h1>
      <SiteSettingsForm
        initialValues={{
          capitalRaised: settings.capitalRaised,
          completedTransactions: settings.completedTransactions,
          activeDeals: settings.activeDeals,
          investorNetwork: settings.investorNetwork,
          teamSectionTitle: settings.teamSectionTitle,
          teamSectionSubtitle: settings.teamSectionSubtitle,
          featuredDealId: settings.featuredDeal?.id ?? null,
          featuredClosedDealIds: settings.featuredClosedDeals.map((d) => d.id),
        }}
        liveDeals={deals.filter((d) => d.status === "LIVE").map((d) => ({ id: d.id, name: d.name }))}
        closedDeals={deals
          .filter((d) => d.status === "CLOSED")
          .map((d) => ({ id: d.id, name: d.name }))}
      />
    </div>
  );
}
