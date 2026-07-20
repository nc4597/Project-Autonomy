"use client";

import { useState } from "react";
import { ApiError, precheckVerification } from "../../lib/api/verificationClient";
import { WizardCard } from "./WizardCard";
import { Field, TextInput } from "../ui/Field";

const VALIDITY_LABEL = "3 years";

type Stage = "question" | "identity" | "no-match" | "match";

interface MatchInfo {
  sourceDealName: string;
  verifiedOn: string;
  validThrough: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * First screen of the KYC wizard: lets an investor who has already been
 * accredited with us skip straight to the thank-you page instead of
 * redoing the whole form. "No" (or no valid match found) falls through
 * to the normal wizard, untouched.
 */
export function ReturningInvestorCheck({
  submissionId,
  onContinueAsNew,
  onFastTracked,
}: {
  submissionId: string;
  onContinueAsNew: () => void;
  onFastTracked: (match: MatchInfo) => void;
}) {
  const [stage, setStage] = useState<Stage>("question");
  const [email, setEmail] = useState("");
  const [taxIdLast4, setTaxIdLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noMatchReason, setNoMatchReason] = useState<"none" | "expired">("none");
  const [match, setMatch] = useState<MatchInfo | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await precheckVerification(submissionId, email.trim(), taxIdLast4.trim());

      if (result.matched) {
        setMatch({
          sourceDealName: result.sourceDealName ?? "a previous offering",
          verifiedOn: result.verifiedOn ?? new Date().toISOString(),
          validThrough: result.validThrough ?? new Date().toISOString(),
        });
        setStage("match");
      } else {
        setNoMatchReason(result.reason === "expired" ? "expired" : "none");
        setStage("no-match");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Too many attempts — please wait a few minutes and try again.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (stage === "question") {
    return (
      <div className="mx-auto max-w-lg">
        <WizardCard
          title="Have you completed accreditation verification with us before?"
          description="If you've submitted accreditation documents for a previous Regiment offering, we may be able to skip you ahead — otherwise, just continue as normal."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStage("identity")}
              className="border border-hairline bg-card p-5 text-left transition-colors hover:border-navy-950"
            >
              <div className="text-sm font-bold text-ink">Yes, I&rsquo;ve submitted before</div>
              <div className="mt-1 text-xs text-ink-secondary">
                I&rsquo;ll confirm my email and last 4 of my SSN or ITIN.
              </div>
            </button>
            <button
              type="button"
              onClick={onContinueAsNew}
              className="border border-hairline bg-card p-5 text-left transition-colors hover:border-navy-950"
            >
              <div className="text-sm font-bold text-ink">No, this is my first time</div>
              <div className="mt-1 text-xs text-ink-secondary">Continue to the standard verification form.</div>
            </button>
          </div>
        </WizardCard>
      </div>
    );
  }

  if (stage === "match") {
    if (!match) return null;
    return (
      <div className="mx-auto max-w-lg">
        <WizardCard
          title="Confirm your identity"
          description="Enter the email and tax ID last-4 (SSN or ITIN) you used on your previous accreditation submission. We'll check it against our records."
        >
          <div className="border-l-2 border-success bg-success/5 px-4 py-3 text-sm text-ink">
            <strong className="text-success">Verification found.</strong> You were accredited on{" "}
            {formatDate(match.verifiedOn)} &mdash; valid until {formatDate(match.validThrough)}.
          </div>
          <div className="border border-hairline bg-page px-5 py-1">
            <div className="flex items-center justify-between border-b border-hairline py-2.5 text-sm">
              <span className="font-bold text-ink">Matched submission</span>
              <span className="text-ink-secondary">{match.sourceDealName}</span>
            </div>
            <div className="flex items-center justify-between border-b border-hairline py-2.5 text-sm">
              <span className="font-bold text-ink">Verified on</span>
              <span className="text-ink-secondary">{formatDate(match.verifiedOn)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-bold text-ink">Valid through</span>
              <span className="text-ink-secondary">{formatDate(match.validThrough)}</span>
            </div>
          </div>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => onFastTracked(match)}
              className="w-full bg-brand-red px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-red-dark"
            >
              Skip to Confirmation &rarr;
            </button>
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              <span className="h-px flex-1 bg-hairline" />
              or
              <span className="h-px flex-1 bg-hairline" />
            </div>
            <button
              type="button"
              onClick={onContinueAsNew}
              className="w-full border border-hairline bg-card px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-ink transition-colors hover:border-navy-950"
            >
              My information has changed
            </button>
            <p className="flex gap-2 text-xs leading-relaxed text-ink-muted">
              <svg
                className="mt-0.5 h-3.5 w-3.5 flex-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>
                Editing your details starts a brand-new verification. You&rsquo;ll complete the full form
                again, and we&rsquo;ll re-verify your accreditation before it&rsquo;s approved &mdash; this
                skip won&rsquo;t apply.
              </span>
            </p>
          </div>
        </WizardCard>
      </div>
    );
  }

  return (
    <form onSubmit={handleCheck} className="mx-auto max-w-lg">
      <WizardCard
        title="Confirm your identity"
        description="Enter the email and SSN last-4 you used on your previous accreditation submission. We'll check it against our records."
      >
        <Field label="Email Address">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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

        {stage === "no-match" &&
          (noMatchReason === "expired" ? (
            <div className="border-l-2 border-brand-red bg-brand-red/5 px-4 py-3 text-sm text-ink">
              <strong className="text-brand-red">Found a prior verification, but it&rsquo;s expired.</strong> Your
              last approval was more than {VALIDITY_LABEL} ago, so we&rsquo;re not able to fast-track this one
              &mdash; please continue below.
            </div>
          ) : (
            <div className="border-l-2 border-brand-red bg-brand-red/5 px-4 py-3 text-sm text-ink">
              <strong className="text-brand-red">No match found.</strong> We couldn&rsquo;t find a verified
              accreditation on file for that email. You can continue with a new submission below.
            </div>
          ))}

        {error && <p className="text-sm text-brand-red">{error}</p>}

        {stage === "no-match" ? (
          <button
            type="button"
            onClick={onContinueAsNew}
            className="w-full bg-brand-red px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-red-dark"
          >
            Continue to Application
          </button>
        ) : (
          <button
            type="submit"
            disabled={busy || !email.trim() || !/^\d{4}$/.test(taxIdLast4.trim())}
            className="w-full bg-brand-red px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-red-dark disabled:opacity-50"
          >
            {busy ? "Checking…" : "Check My Verification"}
          </button>
        )}
      </WizardCard>
    </form>
  );
}
