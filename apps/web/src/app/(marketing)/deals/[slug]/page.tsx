import { AlertCircle, Check, Shield } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { DealThumbnail } from "@/components/ui/DealThumbnail";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import { OFFERING_TYPE_LABELS, SECTOR_LABELS } from "@/lib/marketplace/adapters";
import { getDealBySlug } from "@/lib/marketplace/adminClient";
import { formatCompactCurrency } from "@/lib/marketplace/format";

export const dynamic = "force-dynamic";

export default async function DealOverviewPage({ params }: { params: { slug: string } }) {
  const deal = await getDealBySlug(params.slug);
  if (!deal) notFound();

  const sectorLabel = SECTOR_LABELS[deal.sector];
  const offeringTypeLabel = OFFERING_TYPE_LABELS[deal.offeringType];

  const sidebarDetails = [
    { label: "Offering Type", value: offeringTypeLabel },
    { label: "Minimum Investment", value: formatCompactCurrency(deal.minimumInvestment) },
    { label: "Sector", value: sectorLabel },
    { label: "Issuer", value: deal.name },
    ...deal.sidebarFields.map((field) => ({ label: field.label, value: field.value })),
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 py-14">
        {deal.bannerImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={deal.bannerImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/80 to-navy-950/50" />
          </>
        ) : (
          <>
            <DealThumbnail
              seed={deal.slug}
              className="absolute inset-0 h-full w-full opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/90 to-transparent" />
          </>
        )}
        <Container className="relative">
          <div className="mb-5 flex items-center gap-2">
            <Badge variant={deal.status === "LIVE" ? "live" : "success"}>
              {deal.status === "LIVE" ? "Live" : "100% Funded"}
            </Badge>
            <Badge>{sectorLabel}</Badge>
            <Badge variant="navy">{offeringTypeLabel}</Badge>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden bg-white text-lg font-semibold text-navy-950">
              {deal.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={deal.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                deal.name.slice(0, 2).toUpperCase()
              )}
            </span>
            <div>
              <h1 className="font-serif text-4xl text-white md:text-5xl">{deal.name}</h1>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.1em] text-white/60">
                {deal.subheader}
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
            <h2 className="mb-5 font-serif text-2xl text-ink">Company Overview</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-secondary">
              {deal.companyOverview}
            </p>
          </section>

          {deal.snapshotFields.length > 0 && (
            <section className="border border-hairline bg-card p-8">
              <h2 className="mb-5 font-serif text-2xl text-ink">Investment Snapshot</h2>
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-3">
                {deal.snapshotFields.map((item) => (
                  <div key={item.id}>
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.08em] text-ink">
                      {item.label}
                    </p>
                    <p className="text-sm text-ink-secondary">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {deal.whyInvestBullets.length > 0 && (
            <section className="border border-hairline bg-card p-8">
              <h2 className="mb-5 font-serif text-2xl text-ink">Why Invest</h2>
              <ul className="space-y-4">
                {deal.whyInvestBullets.map((bullet) => (
                  <li key={bullet.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center bg-brand-red/10">
                      <Check className="h-3.5 w-3.5 text-brand-red" strokeWidth={2.5} />
                    </span>
                    <span className="text-sm leading-relaxed text-ink-secondary">
                      {bullet.text}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(deal.marketStats.length > 0 || deal.marketOpportunityNarrative) && (
            <section className="border border-hairline bg-card p-8">
              <h2 className="mb-5 font-serif text-2xl text-ink">Market Opportunity</h2>
              {deal.marketStats.length > 0 && (
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {deal.marketStats.map((stat) => (
                    <div key={stat.id} className="bg-page p-5">
                      <p className="mb-1 font-serif text-2xl text-ink">{stat.value}</p>
                      <p className="text-xs text-ink-secondary">{stat.label}</p>
                    </div>
                  ))}
                </div>
              )}
              {deal.marketOpportunityNarrative && (
                <p className="text-sm leading-relaxed text-ink-secondary">
                  {deal.marketOpportunityNarrative}
                </p>
              )}
            </section>
          )}

          {deal.leadership.length > 0 && (
            <section className="border border-hairline bg-card p-8">
              <h2 className="mb-5 font-serif text-2xl text-ink">Leadership</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {deal.leadership.map((person) => (
                  <div key={person.id} className="flex gap-4 bg-page p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden bg-navy-900 text-xs font-semibold text-white">
                      {person.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={person.photoUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        person.name
                          .split(/\s+/)
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{person.name}</p>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-brand-red">
                        {person.title}
                      </p>
                      <p className="text-sm leading-relaxed text-ink-secondary">{person.bio}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {deal.faqs.length > 0 && (
            <section className="border border-hairline bg-card p-8">
              <h2 className="mb-3 font-serif text-2xl text-ink">
                Frequently Asked Questions
              </h2>
              <FaqAccordion items={deal.faqs} />
            </section>
          )}

          <section className="flex items-start gap-3 border border-hairline bg-page p-8">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-ink-secondary" strokeWidth={1.5} />
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-ink">
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

        <aside className="h-fit lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pr-1 lg:[scrollbar-width:thin]">
          <div className="mb-6 border border-hairline bg-card p-6">
            <div className="mb-6 space-y-4">
              {sidebarDetails.map((item) => (
                <div key={item.label} className="grid grid-cols-2 items-baseline gap-4">
                  <span className="text-sm font-semibold text-ink">{item.label}</span>
                  <span className="text-right text-sm text-ink-secondary">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <Button
              href={`/verify?dealId=${encodeURIComponent(deal.slug)}`}
              variant="primary"
              className="w-full"
            >
              I&apos;m Interested
            </Button>
          </div>

          <div className="mb-6 border border-hairline bg-card p-6 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-ink">
              {deal.repName ? "Meet the Representative" : "Have Questions?"}
            </p>
            {deal.repName && deal.repPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={deal.repPhotoUrl}
                alt=""
                className="mx-auto mb-4 h-28 w-28 object-cover"
              />
            ) : (
              <span className="mx-auto mb-4 flex h-28 w-28 items-center justify-center bg-navy-900 text-2xl font-semibold text-white">
                {deal.repName
                  ? deal.repName
                      .split(/\s+/)
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "IR"}
              </span>
            )}
            <p className="text-base font-semibold text-ink">
              {deal.repName ?? "Investor Relations"}
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-brand-red">
              Regiment Securities
            </p>
            {!deal.repName && (
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                Available Mon-Fri, 9am-6pm EST. Our team is happy to answer any
                questions about this offering.
              </p>
            )}
          </div>

          <div className="bg-navy-950 p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-white">
              FINRA / SIPC Member
            </p>
            <p className="text-sm leading-relaxed text-white/60">
              Regiment Securities LLC is a registered broker-dealer. All
              offerings are reviewed for regulatory compliance before
              listing.
            </p>
          </div>
          <div aria-hidden className="h-6" />
        </aside>
      </Container>
    </>
  );
}
