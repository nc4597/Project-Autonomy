import { z } from "zod";
import { draftSecretValid, draftUnauthorized } from "@/lib/kyc/draftAuth";
import { kycPrisma } from "@/lib/kyc/prisma";
import { customAnswersSchema } from "@/lib/kyc/schemas";
import { upsertCustomAnswers, getPublishedFormConfig } from "@/lib/kyc/formConfig";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

// Saves the answers of one admin-defined wizard page (custom pages have
// no core-column counterpart, so unlike steps 1-3 this carries custom
// answers only). advanceTo moves the draft's resume point forward,
// clamped to the wizard's real length so a stale client can't overshoot.
const bodySchema = z.object({
  customAnswers: customAnswersSchema,
  advanceTo: z.number().int().min(1).max(50).optional(),
});

export async function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (!draftSecretValid(submission, request)) return draftUnauthorized();
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  await upsertCustomAnswers(submission.id, body.customAnswers);

  if (body.advanceTo) {
    const config = await getPublishedFormConfig();
    const lastStep = 4 + config.customPages.length;
    await kycPrisma.verificationSubmission.update({
      where: { id: submission.id },
      data: { currentStep: Math.max(submission.currentStep, Math.min(body.advanceTo, lastStep)) },
    });
  }

  return jsonWithCors({ ok: true });
}
