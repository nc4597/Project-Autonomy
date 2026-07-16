import { kycPrisma } from "@/lib/kyc/prisma";
import { contactInfoSchema, customAnswersSchema } from "@/lib/kyc/schemas";
import { upsertCustomAnswers } from "@/lib/kyc/formConfig";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

const bodySchema = contactInfoSchema.extend({ customAnswers: customAnswersSchema });

export async function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  // Extra runtime guard beyond the zod regex: never persist more than 4
  // digits even if some future client bug sends a full SSN.
  const ssnLast4 = body.ssnLast4.slice(-4);

  const data = {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    dateOfBirth: new Date(body.dateOfBirth),
    ssnLast4,
    streetAddress: body.streetAddress,
    city: body.city,
    state: body.state,
    zipCode: body.zipCode,
    investorType: body.investorType,
  };

  await kycPrisma.contactInfo.upsert({
    where: { submissionId: submission.id },
    create: { submissionId: submission.id, ...data },
    update: data,
  });

  await upsertCustomAnswers(submission.id, body.customAnswers);

  await kycPrisma.verificationSubmission.update({
    where: { id: submission.id },
    data: { currentStep: Math.max(submission.currentStep, 2) },
  });

  return jsonWithCors({ ok: true });
}
