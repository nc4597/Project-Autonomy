import { DealsExplorer } from "@/components/deals/DealsExplorer";
import { DealsPageHeader } from "@/components/deals/DealsPageHeader";
import { toCardDeal } from "@/lib/marketplace/adapters";
import { getDeals } from "@/lib/marketplace/adminClient";

export const dynamic = "force-dynamic";

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { status } = searchParams;
  const initialStatus =
    status === "live" || status === "closed" ? status : "all";

  const deals = (await getDeals()).map(toCardDeal);

  return (
    <>
      <DealsPageHeader />
      <DealsExplorer deals={deals} initialStatus={initialStatus} />
    </>
  );
}
