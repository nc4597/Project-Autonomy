import Image from "next/image";
import Link from "next/link";
import { Container } from "../ui/Container";

const NAV_LINKS = [
  { label: "Marketplace", href: "/" },
  { label: "Deals", href: "/deals" },
  { label: "About", href: "/about" },
];

export function SiteHeader() {
  return (
    <header className="bg-navy-950 text-white">
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative h-8 w-8 overflow-hidden">
            <Image
              src="/brand/regiment-securities-logo.png"
              alt="Regiment Securities"
              fill
              className="object-cover object-left"
            />
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
      </Container>
    </header>
  );
}
