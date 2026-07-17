import { Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Container } from "../ui/Container";

const SOCIAL_LINKS = [
  {
    label: "Regiment Securities on LinkedIn",
    href: "https://www.linkedin.com/company/regimentsecuritiesllc/",
    Icon: Linkedin,
  },
  {
    label: "Regiment Securities on X (Twitter)",
    href: "https://x.com/RegimentSecSoc",
    Icon: Twitter,
  },
];

const FOOTER_COLUMNS: {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}[] = [
  {
    heading: "Marketplace",
    links: [
      { label: "Browse Deals", href: "/deals" },
      { label: "Active Offerings", href: "/deals?status=live" },
      { label: "Closed Transactions", href: "/deals?status=closed" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      {
        label: "Privacy Policy",
        href: "https://static1.squarespace.com/static/60fefef5d70f2e277f6b5fa6/t/6793b6d2fef2f66d1e0a1e1b/1737733842951/Privacy+Policy+01.2025.pdf",
        external: true,
      },
      {
        label: "Client Disclosures",
        href: "https://static1.squarespace.com/static/60fefef5d70f2e277f6b5fa6/t/6a30051d6d2376604c666510/1781531933359/Client+Disclosure+Packet+20260115.pdf",
        external: true,
      },
      { label: "Risk Disclosures", href: "/risk-disclosures" },
      { label: "Form ADV", href: "/form-adv" },
    ],
  },
];

export function ComplianceStrip() {
  return (
    <p className="py-6 text-center text-xs text-ink-muted">
      Powered by Regiment Securities | Express &middot; FINRA/SIPC Member &middot; 256-bit AES Encryption
    </p>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-white">
      <Container className="grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
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
          <div className="mt-6 flex gap-3">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-white/80 text-white transition-colors hover:bg-white hover:text-navy-950"
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </a>
            ))}
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
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/80 hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-white/80 hover:text-white">
                      {link.label}
                    </Link>
                  )}
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
