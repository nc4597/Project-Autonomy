import { NextResponse } from "next/server";
import { kycPrisma } from "@/lib/kyc/prisma";
import { SUBMISSION_INCLUDE } from "@/lib/kyc/serialize";
import { generateSubmissionSummaryPdf } from "@/lib/kyc/submissionSummaryPdf";
import { investorFolderName } from "@/lib/kyc/investorFolder";

// Already gated by middleware.ts (only /login, /api/auth/login,
// /api/public/*, and /api/health are public) — reaching this route at
// all requires a valid admin session.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const submission = await kycPrisma.verificationSubmission.findUnique({
    where: { id: params.id },
    include: SUBMISSION_INCLUDE,
  });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const pdf = await generateSubmissionSummaryPdf(submission);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Verification_Summary_${investorFolderName(submission)}.pdf"`,
    },
  });
}
