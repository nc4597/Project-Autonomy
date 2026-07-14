import { AlertCircle, Check, Shield } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DealThumbnail } from "@/components/ui/DealThumbnail";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { deals } from "@/lib/marketplace/data";
import { formatCompactCurrency, percentFunded } from "@/lib/marketplace/format";
import {
  faqs,
  leadership,
  marketStats,
  sidebarDetails,
  snapshot,
  whyInvest,
} from "./content";

const deal = deals.find((d) => d.slug === "novatech-ai")!;

export default function NovaTechAiDealPage() {
  const percent = percentFunded(deal.raised, deal.goal);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 py-14">
        <DealThumbnail
          seed={deal.slug}
          className="absolute inset-0 h-full w-full opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/90 to-transparent" />
        <Container className="relative">
          <div className="mb-5 flex items-center gap-2">
            <Badge variant="live">Live</Badge>
            <Badge>{deal.sector}</Badge>
            <Badge variant="navy">{deal.dealType}</Badge>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center bg-white text-lg font-semibold text-navy-950">
              {deal.initials}
            </span>
            <div>
              <h1 className="font-serif text-4xl text-white md:text-5xl">
                {deal.name}
              </h1>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.1em] text-white/60">
                {deal.tagline}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <div className="border-b border-hairline bg-card py-4">
        <Container>
          <nav className="flex items-center gap-2 text-sm text-ink-secondary">
            <Link href="/" className="hover:text-ink">
              Marketplace
            </Link>
            <span aria-hidden="true">&rsaquo;</span>
            <Link href="/deals" className="hover:text-ink">
              Deals
            </Link>
            <span aria-hidden="true">&rsaquo;</span>
            <span className="text-ink">{deal.name}</span>
          </nav>
        </Container>
      </div>

      <div className="border-b border-hairline bg-warning-bg py-4">
        <Container className="flex items-start gap-3">
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-warning-text"
            strokeWidth={1.5}
          />
          <p className="text-sm text-warning-text">
            <span className="font-semibold">Teaser overview only.</span>{" "}
            Confidential financial documents and full deal materials are
            available exclusively to verified accredited investors. Complete
            the verification process to unlock the investor data room.
          </p>
        </Container>
      </div>

      <Container className="grid grid-cols-1 gap-8 py-14 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="border border-hairline bg-card p-8">
            <h2 className="mb-5 font-serif text-2xl text-ink">
              Company Overview
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-ink-secondary">
              NovaTech AI has built the premier large language model
              deployment platform for regulated industries — banking,
              healthcare, insurance, and legal. With over 140 enterprise
              clients and $28M in ARR, the company is scaling rapidly
              through direct enterprise sales and channel partnerships. The
              Series B round will fund geographic expansion and
              next-generation model capabilities.
            </p>
            <p className="text-sm leading-relaxed text-ink-secondary">
              The company operates in a large and growing market with
              defensible competitive advantages including proprietary
              technology, long-term enterprise contracts, and significant
              barriers to entry. Management has a demonstrated track record
              of capital-efficient growth and is well-positioned for a
              liquidity event within 3-5 years.
            </p>
          </section>

          <section className="border border-hairline bg-card p-8">
            <h2 className="mb-5 font-serif text-2xl text-ink">
              Investment Snapshot
            </h2>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
              {snapshot.map((item) => (
                <div key={item.label}>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-ink">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-hairline bg-card p-8">
            <h2 className="mb-5 font-serif text-2xl text-ink">Why Invest</h2>
            <ul className="space-y-4">
              {whyInvest.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-brand-red/10">
                    <Check className="h-3.5 w-3.5 text-brand-red" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm leading-relaxed text-ink-secondary">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-hairline bg-card p-8">
            <h2 className="mb-5 font-serif text-2xl text-ink">
              Market Opportunity
            </h2>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {marketStats.map((stat) => (
                <div key={stat.label} className="bg-page p-5">
                  <p className="mb-1 font-serif text-2xl text-ink">
                    {stat.value}
                  </p>
                  <p className="text-xs text-ink-secondary">{stat.label}</p>
                </div>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-ink-secondary">
              The market is at an inflection point driven by regulatory
              changes, enterprise digital transformation, and growing demand
              from institutional buyers. Management estimates the company
              can capture 2-4% of the serviceable market within five years,
              representing $240-480M in revenue potential.
            </p>
          </section>

          <section className="border border-hairline bg-card p-8">
            <h2 className="mb-5 font-serif text-2xl text-ink">Leadership</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {leadership.map((person) => (
                <div key={person.name} className="flex gap-4 bg-page p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-navy-900 text-xs font-semibold text-white">
                    {person.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {person.name}
                    </p>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-red">
                      {person.title}
                    </p>
                    <p className="text-sm leading-relaxed text-ink-secondary">
                      {person.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-hairline bg-card p-8">
            <h2 className="mb-3 font-serif text-2xl text-ink">
              Frequently Asked Questions
            </h2>
            <FaqAccordion items={faqs} />
          </section>

          <section className="flex items-start gap-3 border border-hairline bg-page p-8">
            <Shield
              className="mt-0.5 h-5 w-5 shrink-0 text-ink-secondary"
              strokeWidth={1.5}
            />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-secondary">
                Compliance Notice
              </p>
              <p className="text-sm leading-relaxed text-ink-secondary">
                Securities offered through Regiment Securities LLC, Member
                FINRA/SIPC. This offering is made pursuant to an exemption
                from registration under the Securities Act of 1933.
                Investing in private securities involves substantial risk,
                including the possible loss of your entire investment. Past
                performance is not indicative of future results. This
                communication is for informational purposes only and does
                not constitute an offer to sell or solicitation of an offer
                to buy any security.
              </p>
            </div>
          </section>
        </div>

        <aside className="h-fit lg:sticky lg:top-[100px]">
          <div className="mb-6 border border-hairline bg-card p-6">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-serif text-2xl text-ink">
                {formatCompactCurrency(deal.raised)}
              </span>
              <span className="text-sm text-ink-secondary">{percent}% funded</span>
            </div>
            <ProgressBar percent={percent} />
            <p className="mb-6 mt-2 text-xs text-ink-muted">
              of {formatCompactCurrency(deal.goal)} goal
            </p>

            <div className="mb-6 space-y-4 border-t border-hairline pt-6">
              {sidebarDetails.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-ink-secondary">{item.label}</span>
                  <span className="text-sm font-semibold text-ink">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button href="/verify?dealId=novatech-ai" variant="primary" className="w-full">
                I&apos;m Interested
              </Button>
              <Button variant="secondary" className="w-full">
                Contact Investor Relations
              </Button>
            </div>
          </div>

          <div className="mb-6 bg-navy-950 p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-white">
              FINRA / SIPC Member
            </p>
            <p className="text-sm leading-relaxed text-white/60">
              Regiment Securities LLC is a registered broker-dealer. All
              offerings are reviewed for regulatory compliance before
              listing.
            </p>
          </div>

          <div className="border border-hairline bg-card p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Have Questions?
            </p>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-navy-900 text-xs font-semibold text-white">
                IR
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  Investor Relations
                </p>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-red">
                  Regiment Securities
                </p>
                <p className="text-sm leading-relaxed text-ink-secondary">
                  Available Mon-Fri, 9am-6pm EST. Our team is happy to answer
                  any questions about this offering.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </Container>
    </>
  );
}
