import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { kycPrisma } from "@/lib/kyc/prisma";
import { kycLogger } from "@/lib/kyc/logger";
import { draftSecretValid, draftUnauthorized } from "@/lib/kyc/draftAuth";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";
import { rateLimit, clientIp } from "@/lib/kyc/rateLimit";
import { ACCREDITATION_VALIDITY_YEARS, applyFastTrack, findFastTrackMatch } from "@/lib/kyc/fastTrackService";

// Returning-investor precheck: "have you verified with us before?" Takes
// the same email + SSN last-4 shape as the resume-link identity
// challenge, and gets the same tight rate limit for the same reason —
// SSN last-4 is only a 10,000-value space.
const bodySchema = z.object({
  email: z.string().trim().min(3).max(254),
  taxIdLast4: z.string().trim().regex(/^\d{4}$/),
});

const ATTEMPT_LIMIT = 5;
const ATTEMPT_WINDOW_MS = 15 * 60_000;

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ip = clientIp(request);
  const limited = rateLimit(`precheck:${ip}:${params.id}`, ATTEMPT_LIMIT, ATTEMPT_WINDOW_MS);
  if (!limited.allowed) {
    return jsonWithCors(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (!draftSecretValid(submission, request)) return draftUnauthorized();
  // Only the fresh draft created when the wizard loaded can be
  // fast-tracked — once it's been submitted there is nothing left to
  // skip ahead of.
  if (submission.status !== "DRAFT") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  const match = await findFastTrackMatch(parsed.data.email, parsed.data.taxIdLast4);
  if (match.status !== "match") {
    kycLogger.info(
      { submissionId: submission.id, result: match.status },
      "returning-investor precheck: no valid match"
    );
    return jsonWithCors({ matched: false, reason: match.status });
  }

  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const ok = await applyFastTrack(submission, match.submission, { ip, userAgent });
  if (!ok) {
    return jsonWithCors({ matched: false, reason: "error" });
  }

  const sourceDeal = await prisma.deal.findUnique({
    where: { slug: match.submission.dealId },
    select: { name: true },
  });
  const verifiedOn = match.submission.reviewedAt ?? new Date();
  const validThrough = new Date(verifiedOn.getTime() + ACCREDITATION_VALIDITY_YEARS * 365 * 24 * 60 * 60 * 1000);

  return jsonWithCors({
    matched: true,
    sourceDealName: sourceDeal?.name ?? match.submission.dealId,
    verifiedOn: verifiedOn.toISOString(),
    validThrough: validThrough.toISOString(),
  });
}
