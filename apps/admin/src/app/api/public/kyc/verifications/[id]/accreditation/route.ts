import { kycPrisma } from "@/lib/kyc/prisma";
import { accreditationInfoSchema, customAnswersSchema } from "@/lib/kyc/schemas";
import { upsertCustomAnswers } from "@/lib/kyc/formConfig";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

const bodySchema = accreditationInfoSchema.extend({ customAnswers: customAnswersSchema });

export async function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  await kycPrisma.accreditationInfo.upsert({
    where: { submissionId: submission.id },
    create: { submissionId: submission.id, method: parsed.data.method },
    update: { method: parsed.data.method },
  });

  await upsertCustomAnswers(submission.id, parsed.data.customAnswers);

  await kycPrisma.verificationSubmission.update({
    where: { id: submission.id },
    data: { currentStep: Math.max(submission.currentStep, 4) },
  });

  return jsonWithCors({ ok: true });
}
