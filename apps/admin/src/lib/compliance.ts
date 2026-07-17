import { env } from "./env";

/**
 * Whether this signed-in admin may see and use the Compliance Review
 * (Verify/Reject) controls. Gating turns on once
 * COMPLIANCE_REVIEWER_EMAILS is set — a comma-separated allowlist of
 * Microsoft account emails (Rob's). Unset = every admin can review,
 * which is the pre-gating behavior and keeps local dev working.
 *
 * Callers pass the session email; the review API enforces this
 * server-side too, so hiding the UI is not the only guard.
 */
export function isComplianceReviewer(email: string | null | undefined): boolean {
  const allowlist = (env.COMPLIANCE_REVIEWER_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.length === 0) return true;
  return Boolean(email) && allowlist.includes(String(email).toLowerCase());
}
