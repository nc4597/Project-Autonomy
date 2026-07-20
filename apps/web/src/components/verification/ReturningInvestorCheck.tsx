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
  const [ssnLast4, setSsnLast4] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noMatchReason, setNoMatchReason] = useState<"none" | "expired">("none");
  const [match, setMatch] = useState<MatchInfo | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await precheckVerification(submissionId, email.trim(), ssnLast4.trim());
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
                I&rsquo;ll confirm my email and last 4 of my SSN.
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
          description="Enter the email and SSN last-4 you used on your previous accreditation submission. We'll check it against our records."
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
          <button
            type="button"
            onClick={() => onFastTracked(match)}
            className="w-full bg-brand-red px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-red-dark"
          >
            Skip to Confirmation &rarr;
          </button>
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
        <Field label="SSN — Last 4 Digits">
          <TextInput
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={ssnLast4}
            onChange={(e) => setSsnLast4(e.target.value)}
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
          <>
            <button
              type="submit"
              disabled={busy || !email.trim() || !/^\d{4}$/.test(ssnLast4.trim())}
              className="w-full bg-brand-red px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-brand-red-dark disabled:opacity-50"
            >
              {busy ? "Checking…" : "Check My Verification"}
            </button>
            <p className="text-xs leading-relaxed text-ink-muted">
              Limited to 5 attempts per 15 minutes to prevent misuse.
            </p>
          </>
        )}
      </WizardCard>
    </form>
  );
}
