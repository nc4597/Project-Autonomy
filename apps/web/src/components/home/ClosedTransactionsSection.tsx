"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TombstoneCard } from "@/components/deals/TombstoneCard";
import type { Deal } from "@/lib/marketplace/types";

const CARD_GAP_PX = 24;

/**
 * Every closed transaction in a scroll-snap carousel — three cards in
 * view on desktop, one on mobile. Arrows step one card and fade at the
 * ends; native drag/swipe/trackpad scrolling works throughout. When
 * everything fits without scrolling the arrows and dots stay hidden and
 * this renders like the old static row.
 */
export function ClosedTransactionsSection({ deals }: { deals: Deal[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({ index: 0, atStart: true, atEnd: true });

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = (track.children[0]?.getBoundingClientRect().width ?? 0) + CARD_GAP_PX;
    const maxScroll = track.scrollWidth - track.clientWidth;
    setScrollState({
      index: step > 0 ? Math.round(track.scrollLeft / step) : 0,
      atStart: track.scrollLeft <= 4,
      atEnd: track.scrollLeft >= maxScroll - 4,
    });
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState, deals.length]);

  function scrollToCard(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const step = (track.children[0]?.getBoundingClientRect().width ?? 0) + CARD_GAP_PX;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? ("auto" as const)
      : ("smooth" as const);
    track.scrollTo({ left: index * step, behavior });
  }

  const scrollable = !(scrollState.atStart && scrollState.atEnd);
  const arrowBase =
    "flex h-10 w-10 items-center justify-center border border-navy-950 text-[15px] transition-opacity disabled:opacity-40";

  return (
    <section className="bg-page py-24">
      <Container>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <SectionLabel>Track Record</SectionLabel>
            <h2 className="font-serif text-4xl text-ink">
              Recently Closed Transactions
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button href="/deals?status=closed" variant="secondary">
              View All Transactions
            </Button>
            {scrollable && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  aria-label="Previous transactions"
                  disabled={scrollState.atStart}
                  onClick={() => scrollToCard(scrollState.index - 1)}
                  className={`${arrowBase} bg-transparent text-navy-950`}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Next transactions"
                  disabled={scrollState.atEnd}
                  onClick={() => scrollToCard(scrollState.index + 1)}
                  className={`${arrowBase} bg-navy-950 text-white`}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>

        <div
          ref={trackRef}
          onScroll={updateScrollState}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {deals.map((deal) => (
            <div key={deal.slug} className="w-full shrink-0 snap-start md:w-[calc((100%-3rem)/3)]">
              <TombstoneCard deal={deal} />
            </div>
          ))}
        </div>

        {scrollable && (
          <div className="mt-7 flex justify-center gap-2">
            {deals.map((deal, index) => (
              <button
                key={deal.slug}
                type="button"
                aria-label={`Go to ${deal.name}`}
                onClick={() => scrollToCard(index)}
                className={`h-[7px] w-[7px] rounded-full transition-opacity ${
                  index === scrollState.index ? "bg-navy-950" : "bg-ink-muted opacity-40"
                }`}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
