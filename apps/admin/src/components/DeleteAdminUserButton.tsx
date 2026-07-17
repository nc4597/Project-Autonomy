"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAdminUserButton({ adminUserId, email }: { adminUserId: string; email: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Remove ${email}'s access? They won't be able to sign in anymore.`)) return;
    setDeleting(true);
    await fetch(`/api/admin-users/${adminUserId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs font-semibold uppercase text-brand-red hover:underline disabled:opacity-40"
    >
      {deleting ? "..." : "Remove"}
    </button>
  );
}
