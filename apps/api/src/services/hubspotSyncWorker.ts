import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { syncSubmissionToHubspot } from "./hubspotService.js";

const BACKOFF_BASE_MINUTES = 5;

function nextEligibleAttempt(attempts: number, lastAttemptAt: Date | null): boolean {
  if (!lastAttemptAt) return true;
  const backoffMinutes = BACKOFF_BASE_MINUTES * 2 ** Math.max(0, attempts - 1);
  const eligibleAt = new Date(lastAttemptAt.getTime() + backoffMinutes * 60_000);
  return eligibleAt <= new Date();
}

/**
 * Retries HubSpot syncs that previously failed or were attempted while
 * unconfigured. Intended to be invoked by a Railway Cron Job hitting
 * POST /internal/hubspot/retry-sweep on a schedule (e.g. every 15 min).
 * No queue infra needed yet — sync logic is isolated behind
 * syncSubmissionToHubspot() so this can be swapped for a real queue later
 * without touching the sync logic itself.
 */
export async function runHubspotRetrySweep(): Promise<{ attempted: number }> {
  const candidates = await prisma.hubspotSync.findMany({
    where: { status: { in: ["FAILED", "NOT_CONFIGURED"] } },
  });

  let attempted = 0;
  for (const candidate of candidates) {
    if (!nextEligibleAttempt(candidate.attempts, candidate.lastAttemptAt)) continue;
    attempted += 1;
    await syncSubmissionToHubspot(candidate.submissionId);
  }

  logger.info({ candidates: candidates.length, attempted }, "hubspot retry sweep complete");
  return { attempted };
}
