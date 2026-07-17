"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminTeamMember } from "@/lib/marketplace/adminTypes";

function initials(name: string) {
  // Strip parenthetical nicknames (e.g. "Catherine (O'Connor) Buxton")
  // before taking first + last initials, so they don't get picked up
  // as a middle word.
  const words = name
    .replace(/\([^)]*\)/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0];
  const last = words[words.length - 1][0];
  return (words.length === 1 ? first : first + last).toUpperCase();
}

export function TeamMemberCard({ member }: { member: AdminTeamMember }) {
  const bioRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  // Bios vary from one sentence to several paragraphs, so rather than
  // guessing from character count, measure whether the clamped bio
  // actually overflows its 4-line box before showing "Read more".
  useEffect(() => {
    const el = bioRef.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [member.bio]);

  return (
    <div className="w-full sm:w-[calc(50%-1.25rem)] lg:w-[calc(25%-1.875rem)]">
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
      <p
        ref={bioRef}
        className={`whitespace-pre-line text-sm leading-relaxed text-ink-secondary ${
          expanded ? "" : "line-clamp-4"
        }`}
      >
        {member.bio}
      </p>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-2 text-sm font-semibold text-brand-red hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
