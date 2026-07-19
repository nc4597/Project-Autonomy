import { env } from "./env";
import { prisma } from "./prisma";
import { SERIES_24 } from "./adminAccess";

/**
 * Whether this signed-in admin may see and use the Compliance Review
 * (Verify/Reject) controls.
 *
 * Primary rule: holding a Series 24 license on the Admin Access page.
 * Add another Series 24 principal there and they can review
 * immediately — no configuration.
 *
 * Safety valves: COMPLIANCE_REVIEWER_EMAILS remains an emergency
 * override (comma-separated), and when nobody holds Series 24 AND the
 * override is unset, review stays open to every admin — so access can
 * never be configured into a lockout. Enforced by the review API too,
 * not just the UI.
 */
export async function isComplianceReviewer(email: string | null | undefined): Promise<boolean> {
  const normalized = email?.trim().toLowerCase() ?? null;

  const allowlist = (env.COMPLIANCE_REVIEWER_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (normalized && allowlist.includes(normalized)) return true;

  const holders = await prisma.adminUser.findMany({
    where: { licenses: { has: SERIES_24 } },
    select: { email: true },
  });
  if (holders.length === 0) return allowlist.length === 0;
  return Boolean(normalized) && holders.some((h) => h.email.toLowerCase() === normalized);
}
