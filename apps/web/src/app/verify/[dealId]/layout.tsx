import { SiteHeader } from "../../../components/layout/SiteHeader";
import { SiteFooter, ComplianceStrip } from "../../../components/layout/SiteFooter";
import { Container } from "../../../components/ui/Container";

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SiteHeader />

      <div className="bg-navy-950 py-14 text-white">
        <Container>
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px w-8 bg-brand-red" />
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
              Investor Verification
            </span>
          </div>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">Accredited Investor Verification</h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Complete your verification to access Regiment Marketplace offerings. Documents are encrypted
            and handled by our FINRA-compliant compliance team.
          </p>
        </Container>
      </div>

      <main className="flex-1">{children}</main>

      <ComplianceStrip />
      <SiteFooter />
    </div>
  );
}
