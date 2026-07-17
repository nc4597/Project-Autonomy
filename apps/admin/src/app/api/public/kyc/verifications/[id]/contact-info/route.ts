import { kycPrisma } from "@/lib/kyc/prisma";
import { contactInfoSchema, customAnswersSchema } from "@/lib/kyc/schemas";
import { upsertCustomAnswers, getPublishedFormConfig } from "@/lib/kyc/formConfig";
import { stepNumberAfterCore } from "@/lib/kyc/formConfigShared";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";
import { rateLimit, clientIp } from "@/lib/kyc/rateLimit";

const bodySchema = contactInfoSchema.extend({ customAnswers: customAnswersSchema });

// This is the one public endpoint that receives SSN last-4 and DOB, so
// it gets a per-IP rate limit. Generous for a human revising their own
// contact step, tight for scripted abuse.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 15 * 60_000;

export async function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const limited = rateLimit(`contact-info:${clientIp(request)}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limited.allowed) {
    return jsonWithCors(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

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
    // Advance past this core step to whatever follows it in the
    // published wizard sequence (an admin page may come next).
    data: {
      currentStep: Math.max(
        submission.currentStep,
        stepNumberAfterCore(await getPublishedFormConfig(), 1)
      ),
    },
  });

  return jsonWithCors({ ok: true });
}
