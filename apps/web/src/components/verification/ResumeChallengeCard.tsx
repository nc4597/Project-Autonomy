"use client";

import { useState } from "react";
import { ApiError } from "../../lib/api/verificationClient";
import { WizardCard } from "./WizardCard";
import { Field, TextInput } from "../ui/Field";

/**
 * "Confirm it's you" — shown when a resume link is opened on a device
 * that doesn't hold the draft's access key. The investor confirms the
 * email and tax ID last-4 they applied with; the server verifies and
 * re-issues the key (rate-limited against guessing).
 */
export function ResumeChallengeCard({
  onSubmit,
}: {
  onSubmit: (email: string, taxIdLast4: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [taxIdLast4, setTaxIdLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onSubmit(email.trim(), taxIdLast4.trim());
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Too many attempts — this link is temporarily locked. Please try again in a few minutes.");
      } else if (err instanceof ApiError && err.status === 403) {
        setError("Those details don't match this verification. Please check them and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleUnlock} className="mx-auto max-w-lg">
      <WizardCard
        title="Confirm it's you"
        description="For your security, confirm the details you applied with to reopen your verification. Your saved answers and documents will load once confirmed."
      >
        <Field label="Email Address">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="The email you applied with"
            autoComplete="email"
          />
        </Field>
        <Field label="Tax ID — Last 4 Digits">
          <TextInput
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={taxIdLast4}
            onChange={(e) => setTaxIdLast4(e.target.value)}
            placeholder="••••"
          />
        </Field>

        {error && <p className="text-sm text-brand-red">{error}</p>}

        <button
          type="submit"
          disabled={busy || !email.trim() || !/^\d{4}$/.test(taxIdLast4.trim())}
          className="w-full bg-brand-red px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-red-dark disabled:opacity-50"
        >
          {busy ? "Unlocking…" : "Unlock My Verification"}
        </button>
        <p className="text-xs leading-relaxed text-ink-muted">
          Too many incorrect attempts will temporarily lock this link. Need help? Contact your
          Regiment representative.
        </p>
      </WizardCard>
    </form>
  );
}
