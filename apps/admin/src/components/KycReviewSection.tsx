"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * The compliance decision that closes out a submission's review:
 * Verified (a record, nothing sent) or Rejected (notes are emailed to
 * the investor verbatim and the submission reopens for resubmission).
 * A decision can be changed later; resubmission resets it to Pending.
 */
export function KycReviewSection({
  submissionId,
  reviewStatus,
  reviewNotes,
  reviewedAt,
}: {
  submissionId: string;
  reviewStatus: string;
  reviewNotes: string | null;
  reviewedAt: string | null;
}) {
  const router = useRouter();
  const [choice, setChoice] = useState<"VERIFIED" | "REJECTED" | null>(null);
  const [notes, setNotes] = useState("");
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);

  const decided = reviewStatus !== "PENDING" && !changing;

  async function submitDecision(decision: "VERIFIED" | "REJECTED") {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/kyc/${submissionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          decision === "REJECTED" ? { decision, notes: notes.trim() } : { decision }
        ),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string; emailSent?: boolean };
      if (!response.ok) throw new Error(body.error ?? "Failed to record the decision");
      if (decision === "REJECTED" && body.emailSent === false) {
        setEmailNotice(
          "Decision recorded, but the email could not be sent (check the Zapier webhook configuration)."
        );
      } else {
        setEmailNotice(null);
      }
      setChoice(null);
      setChanging(false);
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function choiceCard(
    kind: "VERIFIED" | "REJECTED",
    title: string,
    description: string,
    activeClasses: string
  ) {
    const active = choice === kind;
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={active}
        onClick={() => setChoice(active ? null : kind)}
        className={`border p-4 text-left transition-colors ${active ? activeClasses : "border-hairline bg-card"}`}
      >
        <span className="flex items-center gap-3">
          <span
            className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center border-2 text-sm font-bold text-white ${
              active
                ? kind === "VERIFIED"
                  ? "border-success bg-success"
                  : "border-brand-red bg-brand-red"
                : "border-ink-muted"
            }`}
          >
            {active ? "✓" : ""}
          </span>
          <span
            className={`text-sm font-bold ${
              active ? (kind === "VERIFIED" ? "text-success" : "text-brand-red") : "text-ink"
            }`}
          >
            {title}
          </span>
        </span>
        <span className="ml-[34px] mt-2 block text-[13px] leading-relaxed text-ink-secondary">
          {description}
        </span>
      </button>
    );
  }

  return (
    <div className="border border-hairline bg-card">
      <div className="border-b border-hairline bg-page px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink">Compliance Review</h2>
      </div>
      <div className="px-5 py-5">
        {decided ? (
          <div>
            {reviewStatus === "VERIFIED" ? (
              <div className="border border-success/40 bg-success/10 px-4 py-3 text-sm text-success">
                ✓ Verified{reviewedAt ? ` · ${formatDateTime(reviewedAt)}` : ""}
              </div>
            ) : (
              <div className="border border-brand-red/40 bg-brand-red/5 px-4 py-3 text-sm text-brand-red">
                Rejected{reviewedAt ? ` · ${formatDateTime(reviewedAt)}` : ""} — the investor was
                emailed and the submission reopened for resubmission.
                {reviewNotes && (
                  <span className="mt-2 block whitespace-pre-wrap text-ink-secondary">
                    Notes sent: {reviewNotes}
                  </span>
                )}
              </div>
            )}
            {emailNotice && <p className="mt-3 text-sm text-warning-text">{emailNotice}</p>}
            <button
              type="button"
              onClick={() => setChanging(true)}
              className="mt-4 text-xs font-semibold uppercase tracking-wide text-navy-950 hover:underline"
            >
              Change Decision
            </button>
          </div>
        ) : (
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {choiceCard(
                "VERIFIED",
                "Verified",
                "Documents and information are complete and sufficient. Marks this submission verified for the whole team.",
                "border-success bg-success/5"
              )}
              {choiceCard(
                "REJECTED",
                "Rejected",
                "Something is missing, expired, inconsistent, or insufficient. Emails the investor and reopens their submission.",
                "border-brand-red bg-brand-red/5"
              )}
            </div>

            {choice === "REJECTED" && (
              <div className="mt-5">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-ink-muted">
                  Notes to the investor — included word-for-word in the email
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. The uploaded tax return is from 2023 — please provide your two most recent years."
                  className="w-full border border-hairline bg-page px-3 py-2.5 text-sm text-ink focus:border-navy-950 focus:outline-none"
                />
                <p className="mt-1 text-xs text-ink-muted">
                  Be specific about which documents to fix — the investor sees exactly this text.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-4">
              {choice === "VERIFIED" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => submitDecision("VERIFIED")}
                  className="bg-success px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Mark as Verified"}
                </button>
              )}
              {choice === "REJECTED" && (
                <button
                  type="button"
                  disabled={busy || notes.trim().length === 0}
                  onClick={() => submitDecision("REJECTED")}
                  className="bg-brand-red px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-brand-red-dark disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Reject & Email Investor"}
                </button>
              )}
              {choice === null && (
                <span className="text-xs text-ink-muted">
                  Tick one to continue — the decision is recorded with a timestamp.
                </span>
              )}
              {changing && (
                <button
                  type="button"
                  onClick={() => {
                    setChanging(false);
                    setChoice(null);
                  }}
                  className="text-xs font-semibold uppercase tracking-wide text-ink-secondary hover:underline"
                >
                  Cancel
                </button>
              )}
            </div>

            {error && <p className="mt-4 text-sm text-brand-red">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
