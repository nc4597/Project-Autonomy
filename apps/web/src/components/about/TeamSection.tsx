import { Container } from "@/components/ui/Container";
import type { AdminTeamMember } from "@/lib/marketplace/adminTypes";
import { TeamMemberCard } from "./TeamMemberCard";

// The subtitle is admin-edited plain text with two conveniences:
// {count} becomes the live member count, and [label](https://url)
// becomes a link — enough expressiveness without a rich-text editor.
function renderSubtitle(text: string, count: number): React.ReactNode[] {
  const withCount = text.replace(/\{count\}/g, String(count));
  const parts: React.ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(withCount))) {
    if (match.index > lastIndex) parts.push(withCount.slice(lastIndex, match.index));
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="text-brand-red underline hover:text-brand-red-dark"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < withCount.length) parts.push(withCount.slice(lastIndex));
  return parts;
}

// Deliberately simple, unlike DealCard — no border, no clickable link.
// Just a photo, name, title, and bio (TeamMemberCard handles the
// clamp/"Read more" toggle since that needs client state).
export function TeamSection({
  members,
  title,
  subtitle,
}: {
  members: AdminTeamMember[];
  title?: string;
  subtitle?: string;
}) {
  if (members.length === 0) return null;

  // Both strings are admin-editable in Home Settings.
  const heading = title?.trim() || "Meet the Investment Relations Team";
  const subheading = subtitle?.trim();

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
          <h2 className="font-serif text-4xl text-ink">{heading}</h2>
          {subheading && (
            <p className="mx-auto mt-4 max-w-2xl text-ink-secondary">
              {renderSubtitle(subheading, members.length)}
            </p>
          )}
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
