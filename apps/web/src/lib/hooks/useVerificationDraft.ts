"use client";

import { useCallback, useEffect, useState } from "react";
import { useVerificationStore } from "../state/verificationStore";
import {
  ApiError,
  createVerificationDraft,
  getVerificationDraft,
  storeDraftSecret,
  unlockVerificationDraft,
} from "../api/verificationClient";

function storageKey(dealId: string) {
  return `verification:${dealId}`;
}

/**
 * Resume-safe draft loader: the server is the source of truth for all
 * saved step data; localStorage only remembers *which* draft belongs to
 * this browser for this deal, so a refresh (or closed tab) never loses
 * anything already PATCHed to the backend.
 *
 * Only in-progress drafts are resumed. A draft that was already
 * SUBMITTED (or one the server no longer knows about) is discarded on
 * load so the visitor starts a fresh verification instead of being
 * stuck on the thank-you screen forever.
 */
export function useVerificationDraft(dealId: string) {
  const { submissionId, draft, isLoading, setSubmissionId, setDraft, setLoading } = useVerificationStore();
  const [error, setError] = useState<string | null>(null);
  // A resume link opened on a device without the draft's access key:
  // the identity challenge must pass before anything loads.
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const id = window.localStorage.getItem(storageKey(dealId));
    if (!id) return;
    const latest = await getVerificationDraft(id);
    setDraft(latest);
  }, [dealId, setDraft]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        // Magic-link resume: the rejection email links back with
        // ?resume=<submissionId> so the investor can reopen their
        // submission from any device — not just the browser whose
        // localStorage remembers it. Adopt the linked draft when it's
        // real and belongs to this deal; a SUBMITTED one still adopts
        // so an outdated link shows the thank-you screen instead of
        // silently starting a blank duplicate.
        const resumeId = new URLSearchParams(window.location.search).get("resume");
        if (resumeId) {
          let resumed = null;
          try {
            resumed = await getVerificationDraft(resumeId);
          } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
              // Locked draft, no key on this device — show the
              // "Confirm it's you" challenge instead of the wizard.
              if (!cancelled) setChallengeId(resumeId);
              return;
            }
            if (!(err instanceof ApiError && err.status === 404)) throw err;
          }
          if (cancelled) return;
          if (resumed && resumed.dealId === dealId) {
            window.localStorage.setItem(storageKey(dealId), resumeId);
            setSubmissionId(resumeId, dealId);
            setDraft(resumed);
            return;
          }
        }

        const existingId = window.localStorage.getItem(storageKey(dealId));

        if (existingId) {
          let existingDraft = null;
          try {
            existingDraft = await getVerificationDraft(existingId);
          } catch (err) {
            if (!(err instanceof ApiError && (err.status === 404 || err.status === 401))) throw err;
          }
          if (cancelled) return;

          if (existingDraft && existingDraft.status === "DRAFT") {
            setSubmissionId(existingId, dealId);
            setDraft(existingDraft);
            return;
          }

          window.localStorage.removeItem(storageKey(dealId));
        }

        const created = await createVerificationDraft(dealId);
        if (cancelled) return;
        window.localStorage.setItem(storageKey(dealId), created.id);
        if (created.clientSecret) storeDraftSecret(created.id, created.clientSecret);
        setSubmissionId(created.id, dealId);
        const freshDraft = await getVerificationDraft(created.id);
        if (cancelled) return;
        setDraft(freshDraft);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load verification draft");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [dealId, setSubmissionId, setDraft, setLoading]);

  /**
   * Passes the resume identity challenge: verifies the details with the
   * server, stores the re-issued access key, and loads the draft.
   * Throws ApiError (403 wrong details / 429 rate-limited) for the
   * challenge UI to render.
   */
  const submitChallenge = useCallback(
    async (email: string, taxIdLast4: string) => {
      if (!challengeId) return;
      const { clientSecret } = await unlockVerificationDraft(challengeId, email, taxIdLast4);
      storeDraftSecret(challengeId, clientSecret);
      const unlocked = await getVerificationDraft(challengeId);
      window.localStorage.setItem(storageKey(dealId), challengeId);
      setSubmissionId(challengeId, dealId);
      setDraft(unlocked);
      setChallengeId(null);
    },
    [challengeId, dealId, setSubmissionId, setDraft]
  );

  return { submissionId, draft, isLoading, error, refresh, challengeId, submitChallenge };
}
