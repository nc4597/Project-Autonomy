import Link from "next/link";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";

const NAV_LINKS = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Deals", href: "/deals" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
];

export function SiteHeader() {
  return (
    <header className="bg-navy-950 text-white">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center bg-brand-red text-sm font-bold">
            R
          </span>
          <span className="text-sm font-semibold tracking-wide">
            REGIMENT <span className="text-white/50">|</span> MARKETPLACE
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-xs font-medium tracking-wide text-white/80 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="uppercase hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="hidden text-xs font-medium uppercase tracking-wide text-white/80 hover:text-white sm:block"
          >
            Login
          </Link>
          <Button href="/verify" variant="primary">
            Become an Investor
          </Button>
        </div>
      </Container>
    </header>
  );
}
