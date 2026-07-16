import { Container } from "@/components/ui/Container";
import type { AdminTeamMember } from "@/lib/marketplace/adminTypes";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Deliberately simple, unlike DealCard — no border, no button, no
// clickable link. Just a photo, name, title, and short bio.
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

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member) => (
            <div key={member.id}>
              <div className="mb-4 flex aspect-square w-full items-center justify-center overflow-hidden bg-navy-900 text-2xl font-semibold text-white">
                {member.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(member.name)
                )}
              </div>
              <h3 className="text-base font-semibold text-ink">{member.name}</h3>
              <p className="mb-2 text-sm text-brand-red">{member.title}</p>
              <p className="text-sm leading-relaxed text-ink-secondary">{member.bio}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
