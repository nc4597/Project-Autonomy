import Link from "next/link";
import { Container } from "../ui/Container";

const FOOTER_COLUMNS = [
  {
    heading: "Marketplace",
    links: [
      { label: "Browse Deals", href: "/deals" },
      { label: "Deal Directory", href: "/marketplace" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Regiment", href: "/about" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
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
  return (
    <footer className="bg-navy-950 text-white">
      <Container className="grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center bg-brand-red text-sm font-bold">
              R
            </span>
            <span className="text-sm font-semibold tracking-wide">REGIMENT SECURITIES</span>
          </div>
          <p className="max-w-xs text-sm text-white/60">
            Private investment marketplace for Reg D deals.
          </p>
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
    </footer>
  );
}
