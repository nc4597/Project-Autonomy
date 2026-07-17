import { Container } from "@/components/ui/Container";
import { TeamSection } from "@/components/about/TeamSection";
import { Cta } from "@/components/home/Cta";
import { getSiteSettings, getTeamMembers } from "@/lib/marketplace/adminClient";
import type { AdminSiteSettings, AdminTeamMember } from "@/lib/marketplace/adminTypes";

// Fetch at request time, never during `next build` — same convention as
// the home/deals pages (a build must not depend on the admin service
// being up).
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  // Unlike the deals pages (where CMS data IS the page), the team grid
  // is an optional section — if the admin service is unreachable, render
  // the page without it rather than erroring.
  let teamMembers: AdminTeamMember[] = [];
  let settings: AdminSiteSettings | null = null;
  try {
    [teamMembers, settings] = await Promise.all([getTeamMembers(), getSiteSettings()]);
  } catch {
    // TeamSection renders nothing for an empty list and falls back to
    // its default heading without settings.
  }

  return (
    <>
      <div className="bg-navy-950 py-20 text-white">
        <Container>
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px w-8 bg-brand-red" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-red">
              About Regiment
            </span>
          </div>
          <h1 className="font-serif text-4xl font-bold sm:text-5xl">Private Markets, Institutional Rigor</h1>
          <p className="mt-4 max-w-2xl text-white/70">
            Regiment Marketplace is a private investment platform operated by Regiment Securities LLC, a
            registered broker-dealer and member of FINRA/SIPC. We connect accredited investors with
            off-market opportunities sourced through our proprietary network of founders, sponsors, and
            family offices.
          </p>
        </Container>
      </div>

      <div className="bg-page py-16">
        <Container className="max-w-3xl">
          <p className="text-base leading-relaxed text-ink-secondary">
            Every offering on Regiment Marketplace is reviewed by our investment banking team before
            it&rsquo;s listed, and every investor works with a dedicated Regiment representative from
            first contact through funding. We built this platform because accredited investors deserve
            the same diligence and service in private markets that they expect from public ones.
          </p>
        </Container>
      </div>

      <TeamSection
        members={teamMembers}
        title={settings?.teamSectionTitle}
        subtitle={settings?.teamSectionSubtitle}
      />
      <Cta />
    </>
  );
}
