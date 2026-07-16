import { kycPrisma } from "@/lib/kyc/prisma";
import { customAnswersSchema, kycAmlInfoSchema } from "@/lib/kyc/schemas";
import { upsertCustomAnswers } from "@/lib/kyc/formConfig";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

const bodySchema = kycAmlInfoSchema.extend({ customAnswers: customAnswersSchema });

export async function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const { customAnswers, ...info } = parsed.data;

  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  await kycPrisma.kycAmlInfo.upsert({
    where: { submissionId: submission.id },
    create: { submissionId: submission.id, ...info },
    update: { ...info },
  });

  await upsertCustomAnswers(submission.id, customAnswers);

  await kycPrisma.verificationSubmission.update({
    where: { id: submission.id },
    data: { currentStep: Math.max(submission.currentStep, 3) },
  });

  return jsonWithCors({ ok: true });
}
