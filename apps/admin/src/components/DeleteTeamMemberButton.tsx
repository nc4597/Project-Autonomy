"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteTeamMemberButton({ teamMemberId, name }: { teamMemberId: string; name: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/team/${teamMemberId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs font-semibold uppercase text-brand-red hover:underline disabled:opacity-40"
    >
      {deleting ? "..." : "Delete"}
    </button>
  );
}
