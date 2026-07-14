import { Briefcase, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { Container } from "@/components/ui/Container";
import type { Kpi } from "@/lib/marketplace/types";

const icons = [TrendingUp, CheckCircle2, Briefcase, Users];

export function KpiStrip({ kpis }: { kpis: Kpi[] }) {
  return (
    <section className="bg-card">
      <Container className="grid grid-cols-2 divide-x divide-y divide-hairline border-b border-hairline md:grid-cols-4 md:divide-y-0">
        {kpis.map((kpi, i) => {
          const Icon = icons[i % icons.length];
          return (
            <div key={kpi.label} className="px-6 py-10 text-center md:text-left">
              <Icon
                className="mx-auto mb-4 h-5 w-5 text-brand-red md:mx-0"
                strokeWidth={1.5}
              />
              <p className="mb-1 font-serif text-3xl text-ink md:text-4xl">
                {kpi.value}
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-secondary">
                {kpi.label}
              </p>
            </div>
          );
        })}
      </Container>
    </section>
  );
}
