import { DealsExplorer } from "@/components/deals/DealsExplorer";
import { DealsPageHeader } from "@/components/deals/DealsPageHeader";
import { deals } from "@/lib/marketplace/data";

export default function DealsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const { status } = searchParams;
  const initialStatus =
    status === "live" || status === "closed" ? status : "all";

  return (
    <>
      <DealsPageHeader />
      <DealsExplorer deals={deals} initialStatus={initialStatus} />
    </>
  );
}
