"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";
import { DealCard } from "@/components/deals/DealCard";
import { TombstoneCard } from "@/components/deals/TombstoneCard";
import { FilterBar } from "@/components/deals/FilterBar";
import type { Deal, DealType, Sector } from "@/lib/marketplace/types";

type StatusFilter = "all" | "live" | "closed";

export function DealsExplorer({
  deals,
  initialStatus = "all",
}: {
  deals: Deal[];
  initialStatus?: StatusFilter;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [sector, setSector] = useState<Sector | "all">("all");
  const [dealType, setDealType] = useState<DealType | "all">("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return deals.filter((deal) => {
      if (status !== "all" && deal.status !== status) return false;
      if (sector !== "all" && deal.sector !== sector) return false;
      if (dealType !== "all" && deal.dealType !== dealType) return false;
      if (query && !deal.name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [deals, status, sector, dealType, search]);

  const liveDeals = filtered.filter((deal) => deal.status === "live");
  const closedDeals = filtered.filter((deal) => deal.status === "closed");

  return (
    <>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        sector={sector}
        onSectorChange={setSector}
        dealType={dealType}
        onDealTypeChange={setDealType}
        resultCount={filtered.length}
      />

      <Container className="py-14">
        {liveDeals.length > 0 && (
          <div className="mb-16">
            <div className="mb-8 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-success"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink">
                Active Offerings ({liveDeals.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {liveDeals.map((deal) => (
                <DealCard key={deal.slug} deal={deal} />
              ))}
            </div>
          </div>
        )}

        {closedDeals.length > 0 && (
          <div>
            <div className="mb-8 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full bg-ink-muted"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink">
                Closed Transactions ({closedDeals.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {closedDeals.map((deal) => (
                <TombstoneCard key={deal.slug} deal={deal} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <p className="py-20 text-center text-sm text-ink-secondary">
            No offerings match your filters. Try adjusting your search.
          </p>
        )}
      </Container>
    </>
  );
}
