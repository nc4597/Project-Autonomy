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

      <Container className="relative py-28 md:py-36">
        <div className="mb-8 flex items-center gap-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
          <span className="h-4 w-[3px] bg-brand-red" aria-hidden="true" />
          Regiment Securities &mdash; Private Marketplace
        </div>
        <h1 className="mb-8 max-w-2xl font-serif text-5xl leading-[1.08] text-white md:text-7xl">
          Off-Market Deals. <em className="italic text-ink-muted">VIP Access.</em>
        </h1>
        <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/70">
          Exclusive access to institutional-quality private investments,
          curated for accredited investors by the investment banking team at
          Regiment Securities.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button href="/deals" variant="primary" arrow>
            View Marketplace
          </Button>
          <Button href="/verify" variant="secondary-light">
            Become an Investor
          </Button>
        </div>
      </Container>
    </section>
  );
}
