import { kycPrisma } from "@/lib/kyc/prisma";
import { draftSecretValid, draftUnauthorized } from "@/lib/kyc/draftAuth";
import { SUBMISSION_INCLUDE, serializeSubmission } from "@/lib/kyc/serialize";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const submission = await kycPrisma.verificationSubmission.findUnique({
    where: { id: params.id },
    include: SUBMISSION_INCLUDE,
  });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (!draftSecretValid(submission, request)) return draftUnauthorized();
  return jsonWithCors(serializeSubmission(submission));
}
