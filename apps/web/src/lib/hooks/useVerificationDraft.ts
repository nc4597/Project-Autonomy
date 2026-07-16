"use client";

import { useCallback, useEffect, useState } from "react";
import { useVerificationStore } from "../state/verificationStore";
import { ApiError, createVerificationDraft, getVerificationDraft } from "../api/verificationClient";

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
        const existingId = window.localStorage.getItem(storageKey(dealId));

        if (existingId) {
          let existingDraft = null;
          try {
            existingDraft = await getVerificationDraft(existingId);
          } catch (err) {
            if (!(err instanceof ApiError && err.status === 404)) throw err;
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

  return { submissionId, draft, isLoading, error, refresh };
}
