import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DealThumbnail } from "@/components/ui/DealThumbnail";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCompactCurrency, percentFunded } from "@/lib/marketplace/format";
import type { Deal } from "@/lib/marketplace/types";

export function FeaturedDealCard({ deal }: { deal: Deal }) {
  const percent = percentFunded(deal.raised, deal.goal);

  return (
    <div className="grid grid-cols-1 border border-hairline bg-card md:grid-cols-2">
      <div className="relative h-64 md:h-auto">
        <DealThumbnail seed={deal.slug} className="h-full w-full" />
        <span className="absolute left-6 top-6 flex h-11 w-11 items-center justify-center bg-white text-sm font-semibold text-navy-950">
          {deal.initials}
        </span>
        <div className="absolute bottom-6 left-6 flex gap-2">
          <Badge variant="live">Live</Badge>
          <Badge>{deal.sector}</Badge>
          <Badge variant="navy">{deal.dealType}</Badge>
        </div>
      </div>

      <div className="flex flex-col justify-center p-8 md:p-12">
        <h3 className="mb-1 font-serif text-3xl text-ink">{deal.name}</h3>
        <p className="mb-5 text-sm font-semibold uppercase tracking-[0.08em] text-ink-secondary">
          {deal.tagline}
        </p>
        <p className="mb-8 text-base leading-relaxed text-ink-secondary">
          {deal.summary}
        </p>

        <div className="mb-6">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-lg font-semibold text-ink">
              {formatCompactCurrency(deal.raised)}
            </span>
            <span className="text-sm text-ink-secondary">{percent}%</span>
          </div>
          <ProgressBar percent={percent} />
          <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
            <span>Goal: {formatCompactCurrency(deal.goal)}</span>
            <span>Min: {formatCompactCurrency(deal.minInvestment)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Min. Investment
            </p>
            <p className="font-serif text-2xl text-ink">
              {formatCompactCurrency(deal.minInvestment)}
            </p>
          </div>
          <Button href={`/deals/${deal.slug}`} variant="dark" arrow>
            View Deal
          </Button>
        </div>
      </div>
    </div>
  );
}
