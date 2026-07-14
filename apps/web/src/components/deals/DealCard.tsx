import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DealThumbnail } from "@/components/ui/DealThumbnail";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCompactCurrency, percentFunded } from "@/lib/marketplace/format";
import type { Deal } from "@/lib/marketplace/types";

export function DealCard({ deal }: { deal: Deal }) {
  const percent = percentFunded(deal.raised, deal.goal);

  return (
    <div className="flex flex-col border border-hairline bg-card">
      <div className="relative h-44 w-full">
        {deal.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={deal.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <DealThumbnail seed={deal.slug} className="h-full w-full" />
        )}
        <span className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center overflow-hidden bg-white text-xs font-semibold text-navy-950">
          {deal.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={deal.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            deal.initials
          )}
        </span>
        <span className="absolute right-4 top-4">
          <Badge variant="navy">{deal.dealType}</Badge>
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="font-serif text-lg text-ink">{deal.name}</h3>
          <Badge>{deal.sector}</Badge>
        </div>
        <p className="mb-3 text-sm text-ink-secondary">{deal.tagline}</p>
        <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-ink-secondary">
          {deal.summary}
        </p>

        <div className="mt-auto">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-ink">
              {formatCompactCurrency(deal.raised)} raised
            </span>
            <span className="text-sm text-ink-secondary">{percent}%</span>
          </div>
          <ProgressBar percent={percent} />
          <div className="mb-6 mt-2 flex items-center justify-between text-xs text-ink-muted">
            <span>Goal: {formatCompactCurrency(deal.goal)}</span>
            <span>Min: {formatCompactCurrency(deal.minInvestment)}</span>
          </div>
          <Button
            href={`/deals/${deal.slug}`}
            variant="primary"
            arrow
            className="w-full"
          >
            View Deal
          </Button>
        </div>
      </div>
    </div>
  );
}
