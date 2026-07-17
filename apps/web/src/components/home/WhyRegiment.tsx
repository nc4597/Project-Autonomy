import { Award, Lock, Shield, Users } from "lucide-react";
import { Container } from "@/components/ui/Container";

const values = [
  {
    icon: Shield,
    title: "Institutional Due Diligence",
    description:
      "Every offering is reviewed by Regiment's investment banking team. We apply the same rigor to private deals as to public markets.",
  },
  {
    icon: Lock,
    title: "Off-Market Access",
    description:
      "Deals unavailable to the general public, sourced through Regiment's proprietary network of founders, sponsors, and family offices.",
  },
  {
    icon: Award,
    title: "FINRA / SIPC Member",
    description:
      "Regiment Securities is a registered broker-dealer. Your investments are made through a fully regulated and compliant platform.",
  },
  {
    icon: Users,
    title: "Dedicated Investor Relations",
    description:
      "A named Regiment representative is assigned to every investor. High-touch service from first contact through full realization.",
  },
];

export function WhyRegiment() {
  return (
    <section className="bg-card py-24">
      <Container>
        <div className="mb-3 flex items-center gap-3">
          <span className="h-0.5 w-8 bg-brand-red" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-red">
            The Regiment Advantage
          </span>
        </div>
        <h2 className="mb-16 text-center font-serif text-4xl font-semibold text-ink">
          Why Regiment Express
        </h2>

        <div className="grid grid-cols-1 divide-y divide-hairline border-t border-hairline md:grid-cols-4 md:divide-x md:divide-y-0 md:border-t-0">
          {values.map((value) => (
            <div key={value.title} className="px-6 py-8 first:pl-0 md:px-8 md:py-0">
              <span className="mb-5 flex h-11 w-11 items-center justify-center bg-page">
                <value.icon className="h-5 w-5 text-brand-red" strokeWidth={1.5} />
              </span>
              <h3 className="mb-3 text-base font-semibold text-ink">
                {value.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink-secondary">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
