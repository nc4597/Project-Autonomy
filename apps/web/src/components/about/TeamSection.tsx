import { Container } from "@/components/ui/Container";
import type { AdminTeamMember } from "@/lib/marketplace/adminTypes";
import { TeamMemberCard } from "./TeamMemberCard";

// Deliberately simple, unlike DealCard — no border, no clickable link.
// Just a photo, name, title, and bio (TeamMemberCard handles the
// clamp/"Read more" toggle since that needs client state).
export function TeamSection({ members }: { members: AdminTeamMember[] }) {
  if (members.length === 0) return null;

  return (
    <section className="bg-card py-24">
      <Container>
        <div className="mb-16 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-brand-red" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-red">
              Our People
            </span>
            <span className="h-px w-8 bg-brand-red" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-4xl text-ink">Meet the Team</h2>
        </div>

        <div className="flex flex-wrap justify-center gap-10">
          {members.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </Container>
    </section>
  );
}
