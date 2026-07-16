import Image from "next/image";
import Link from "next/link";
import { Container } from "../ui/Container";

const FOOTER_COLUMNS = [
  {
    heading: "Marketplace",
    links: [
      { label: "Browse Deals", href: "/deals" },
      { label: "Active Offerings", href: "/deals?status=active" },
      { label: "Closed Transactions", href: "/deals?status=closed" },
      { label: "Track Record", href: "/track-record" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Regiment", href: "/about" },
      { label: "Investor Relations", href: "/investor-relations" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Risk Disclosures", href: "/risk-disclosures" },
      { label: "Form ADV", href: "/form-adv" },
    ],
  },
];

export function ComplianceStrip() {
  return (
    <p className="py-6 text-center text-xs text-ink-muted">
      Powered by Regiment Marketplace &middot; FINRA/SIPC Member &middot; 256-bit AES Encryption
    </p>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-white">
      <Container className="grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <Image
              src="/brand/regiment-securities-logo.png"
              alt="Regiment Securities"
              width={240}
              height={48}
              className="h-8 w-auto"
            />
          </div>
          <p className="max-w-xs text-sm text-white/60">
            Private investment marketplace for accredited investors. A Regiment Securities LLC offering.
          </p>
          <div className="mt-4 flex gap-2">
            <span className="border border-white/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
              FINRA Member
            </span>
            <span className="border border-white/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/70">
              SIPC Member
            </span>
          </div>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.heading}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">
              {column.heading}
            </h3>
            <ul className="space-y-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/80 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <p className="max-w-3xl leading-relaxed">
            Regiment Securities LLC is a registered broker-dealer, Member FINRA/SIPC. Investing in
            private securities involves substantial risk, including possible total loss of investment.
            Past performance is not indicative of future results. This communication does not
            constitute an offer to buy or sell any security.
          </p>
          <p className="shrink-0">&copy; {year} Regiment Securities LLC</p>
        </Container>
      </div>
    </footer>
  );
}
