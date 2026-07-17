import { randomUUID } from "node:crypto";
import { z } from "zod";
import { kycPrisma } from "@/lib/kyc/prisma";
import { kycLogger } from "@/lib/kyc/logger";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";
import { rateLimit, clientIp } from "@/lib/kyc/rateLimit";

// Identity challenge behind resume links: proves the visitor is the
// original applicant (email + SSN last-4 they applied with) before
// re-issuing the draft's clientSecret to a new device. Tight rate limit
// — SSN last-4 is a 10k space, so wrong answers lock the challenge fast.
const bodySchema = z.object({
  email: z.string().trim().min(3).max(254),
  ssnLast4: z.string().trim().regex(/^\d{4}$/),
});

const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW_MS = 15 * 60_000;

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ip = clientIp(request);
  const limited = rateLimit(`unlock:${ip}:${params.id}`, ATTEMPT_LIMIT, ATTEMPT_WINDOW_MS);
  if (!limited.allowed) {
    return jsonWithCors(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const submission = await kycPrisma.verificationSubmission.findUnique({
    where: { id: params.id },
    include: { contactInfo: true },
  });
  // One generic error for wrong id / no contact info / wrong answers —
  // the challenge must not reveal which part failed.
  const mismatch = jsonWithCors(
    { error: "Those details don't match this verification." },
    { status: 403 }
  );
  if (!submission?.contactInfo) return mismatch;

  const emailMatches =
    submission.contactInfo.email.trim().toLowerCase() === parsed.data.email.toLowerCase();
  const ssnMatches = submission.contactInfo.ssnLast4 === parsed.data.ssnLast4;
  if (!emailMatches || !ssnMatches) {
    kycLogger.warn({ submissionId: submission.id, ip }, "resume unlock challenge failed");
    return mismatch;
  }

  // Re-issue (or first-issue, for grandfathered drafts) the key. Not
  // rotated on purpose: the investor's other devices keep working.
  const clientSecret = submission.clientSecret ?? randomUUID();
  if (!submission.clientSecret) {
    await kycPrisma.verificationSubmission.update({
      where: { id: submission.id },
      data: { clientSecret },
    });
  }
  kycLogger.info({ submissionId: submission.id }, "resume unlock challenge passed");
  return jsonWithCors({ clientSecret });
}
