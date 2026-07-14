import { SiteHeader } from "../../../components/layout/SiteHeader";
import { SiteFooter, ComplianceStrip } from "../../../components/layout/SiteFooter";

export default function VerifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SiteHeader />

      <main className="flex-1">{children}</main>

      <ComplianceStrip />
      <SiteFooter />
    </div>
  );
}
