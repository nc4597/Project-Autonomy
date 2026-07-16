import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy-950">
      <Image
        src="/home/hero-skyline.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/95 via-navy-950/75 to-navy-950/40" />

      <Container className="relative py-16 md:pb-[92px] md:pt-[84px]">
        <div className="mb-9 flex items-center gap-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
          <span className="h-4 w-[3px] bg-brand-red" aria-hidden="true" />
          Regiment Securities &mdash; Private Marketplace
        </div>
        <h1 className="mb-8 max-w-[470px] font-serif text-5xl font-semibold leading-[1.16] text-white md:text-[66px]">
          Off-Market Deals. <em className="italic text-ink-muted">VIP Access.</em>
        </h1>
        <p className="mb-11 max-w-[520px] text-[17px] leading-relaxed text-white/70">
          Exclusive access to institutional-quality private investments,
          curated for accredited investors by the investment banking team at
          Regiment Securities.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button href="/deals" variant="primary" arrow className="px-[26px] py-3.5">
            View Marketplace
          </Button>
          <Button href="/verify" variant="secondary-light" className="px-[26px] py-3.5">
            Become an Investor
          </Button>
        </div>
      </Container>
    </section>
  );
}
