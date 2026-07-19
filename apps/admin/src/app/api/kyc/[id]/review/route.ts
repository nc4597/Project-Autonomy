import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isComplianceReviewer } from "@/lib/compliance";
import { kycPrisma } from "@/lib/kyc/prisma";
import { kycLogger } from "@/lib/kyc/logger";
import { notifyInvestorOfRejection, notifyRepOfVerification } from "@/lib/kyc/submissionNotificationService";

const bodySchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED"]),
  notes: z.string().trim().max(2000).optional(),
});

// Already gated by middleware.ts (only /login, /api/auth/login,
// /api/public/*, and /api/health are public) — reaching this route at
// all requires a valid admin session.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  // Middleware guarantees a signed-in admin; this is the stricter
  // compliance check — only allowlisted reviewers may decide.
  const session = await auth();
  if (!isComplianceReviewer(session?.user?.email)) {
    return NextResponse.json(
      { error: "Compliance review is restricted to authorized reviewers" },
      { status: 403 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
  }
  const { decision, notes } = parsed.data;

  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const reviewedBy = session?.user?.email ?? null;

  if (decision === "VERIFIED") {
    await kycPrisma.verificationSubmission.update({
      where: { id: submission.id },
      data: { reviewStatus: "VERIFIED", reviewNotes: null, reviewedAt: new Date(), reviewedBy },
    });
    const emailSent = await notifyRepOfVerification(submission.id, {
      name: session?.user?.name ?? null,
      email: reviewedBy,
    });
    kycLogger.info({ submissionId: submission.id, emailSent }, "submission marked verified");
    return NextResponse.json({ ok: true, emailSent });
  }

  // Rejection: the notes are what the investor receives, so an empty
  // rejection is not allowed.
  if (!notes) {
    return NextResponse.json(
      { error: "Notes to the investor are required to reject" },
      { status: 422 }
    );
  }

  // Reopen the submission so the investor can revise and resubmit —
  // everything they entered stays in place.
  await kycPrisma.verificationSubmission.update({
    where: { id: submission.id },
    data: { reviewStatus: "REJECTED", reviewNotes: notes, reviewedAt: new Date(), reviewedBy, status: "DRAFT" },
  });
  const emailSent = await notifyInvestorOfRejection(submission.id, notes);
  kycLogger.info({ submissionId: submission.id, emailSent }, "submission rejected");
  return NextResponse.json({ ok: true, emailSent });
}
