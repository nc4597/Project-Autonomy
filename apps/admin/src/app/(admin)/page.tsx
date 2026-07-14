import Link from "next/link";
import { listDeals } from "@/lib/dealRepository";
import { OFFERING_TYPE_LABELS, SECTOR_LABELS } from "@/lib/labels";
import { DeleteDealButton } from "@/components/DeleteDealButton";

export const dynamic = "force-dynamic";

export default async function DealsListPage() {
  const deals = await listDeals();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-3xl text-ink">Deals</h1>
        <Link
          href="/deals/new"
          className="bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-red-dark"
        >
          + Add Deal
        </Link>
      </div>

      <div className="border border-hairline bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-xs font-semibold uppercase tracking-wide text-ink-secondary">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Offering</th>
              <th className="px-4 py-3">Raised / Goal</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr key={deal.id} className="border-b border-hairline last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{deal.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-[11px] font-semibold uppercase ${
                      deal.status === "LIVE"
                        ? "bg-success/10 text-success"
                        : "bg-ink-muted/10 text-ink-muted"
                    }`}
                  >
                    {deal.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-secondary">{SECTOR_LABELS[deal.sector]}</td>
                <td className="px-4 py-3 text-ink-secondary">
                  {OFFERING_TYPE_LABELS[deal.offeringType]}
                </td>
                <td className="px-4 py-3 text-ink-secondary">
                  ${Number(deal.raisedAmount).toLocaleString()} / $
                  {Number(deal.raiseGoal).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="mr-4 text-xs font-semibold uppercase text-navy-950 hover:underline"
                  >
                    Edit
                  </Link>
                  <DeleteDealButton dealId={deal.id} dealName={deal.name} />
                </td>
              </tr>
            ))}
            {deals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-ink-secondary">
                  No deals yet. Click &ldquo;Add Deal&rdquo; to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
