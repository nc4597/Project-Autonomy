import { Badge } from "@/components/ui/Badge";
import { formatCloseDate, formatCompactCurrency } from "@/lib/marketplace/format";
import type { Deal } from "@/lib/marketplace/types";

export function TombstoneCard({ deal }: { deal: Deal }) {
  return (
    <div className="border border-hairline bg-card p-7">
      <div className="mb-6 flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center overflow-hidden bg-navy-800 text-sm font-semibold text-white">
          {deal.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={deal.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            deal.initials
          )}
        </span>
        <Badge variant="success">100% Funded</Badge>
      </div>

      <h3 className="mb-1 font-serif text-lg text-ink">{deal.name}</h3>
      <p className="mb-5 text-sm text-ink-secondary">{deal.tagline}</p>

      <div className="grid grid-cols-2 gap-y-4 border-t border-hairline pt-5">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Raised
          </p>
          <p className="text-sm font-semibold text-ink">
            {formatCompactCurrency(deal.raised)}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Closed
          </p>
          <p className="text-sm font-semibold text-ink">
            {deal.closeDate ? formatCloseDate(deal.closeDate) : "—"}
          </p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Type
          </p>
          <p className="text-sm font-semibold text-ink">{deal.dealType}</p>
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            Sector
          </p>
          <p className="text-sm font-semibold text-ink">{deal.sector}</p>
        </div>
      </div>
    </div>
  );
}
