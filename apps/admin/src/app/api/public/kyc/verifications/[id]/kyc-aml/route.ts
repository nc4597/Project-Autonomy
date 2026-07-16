import { kycPrisma } from "@/lib/kyc/prisma";
import { kycAmlInfoSchema } from "@/lib/kyc/schemas";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const parsed = await parseJsonBody(request, kycAmlInfoSchema);
  if (!parsed.ok) return parsed.response;

  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  await kycPrisma.kycAmlInfo.upsert({
    where: { submissionId: submission.id },
    create: { submissionId: submission.id, ...parsed.data },
    update: { ...parsed.data },
  });

  await kycPrisma.verificationSubmission.update({
    where: { id: submission.id },
    data: { currentStep: Math.max(submission.currentStep, 3) },
  });

  return jsonWithCors({ ok: true });
}
