import { kycPrisma } from "@/lib/kyc/prisma";
import { SUBMISSION_INCLUDE, serializeSubmission } from "@/lib/kyc/serialize";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const submission = await kycPrisma.verificationSubmission.findUnique({
    where: { id: params.id },
    include: SUBMISSION_INCLUDE,
  });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  return jsonWithCors(serializeSubmission(submission));
}
