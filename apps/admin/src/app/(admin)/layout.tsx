import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-hairline bg-navy-950">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4">
          <Link href="/" className="font-serif text-lg text-white">
            Regiment Marketplace <span className="text-white/40">Admin</span>
          </Link>
          <nav className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wide text-white/70">
            <Link href="/" className="hover:text-white">
              Deals
            </Link>
            <Link href="/team" className="hover:text-white">
              Team
            </Link>
            <Link href="/kyc" className="hover:text-white">
              KYC Review
            </Link>
            <Link href="/verification-form" className="hover:text-white">
              Verification Form
            </Link>
            <Link href="/settings" className="hover:text-white">
              Home Settings
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-content px-6 py-10">{children}</main>
    </div>
  );
}
