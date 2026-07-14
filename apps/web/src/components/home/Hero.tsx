import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={i}
            x1={i * 30}
            y1="0"
            x2={i * 30 - 60}
            y2="300"
            stroke="#ffffff"
            strokeWidth="1"
          />
        ))}
      </svg>

      <Container className="relative py-28 md:py-36">
        <h1 className="mb-6 max-w-2xl font-serif text-5xl leading-[1.1] text-white md:text-6xl">
          Off-Market Deals. VIP Access.
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
