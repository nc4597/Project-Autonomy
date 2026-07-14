"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setSubmitting(false);

    if (!res.ok) {
      setError("Incorrect password.");
      return;
    }

    router.push(searchParams.get("from") || "/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-hairline bg-card p-8"
      >
        <h1 className="mb-1 font-serif text-2xl text-ink">Regiment Marketplace</h1>
        <p className="mb-6 text-sm text-ink-secondary">Admin sign in</p>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
          Password
        </label>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full border border-hairline bg-page px-4 py-3 text-sm text-ink focus:border-navy-800 focus:outline-none"
        />

        {error && <p className="mb-4 text-sm text-brand-red">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-red px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-red-dark disabled:opacity-40"
        >
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
