import { kycPrisma } from "@/lib/kyc/prisma";
import { draftSecretValid, draftUnauthorized } from "@/lib/kyc/draftAuth";
import { contactInfoBaseSchema, customAnswersSchema, refineContactInfo } from "@/lib/kyc/schemas";
import { upsertCustomAnswers, getPublishedFormConfig } from "@/lib/kyc/formConfig";
import { stepNumberAfterCore } from "@/lib/kyc/formConfigShared";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";
import { rateLimit, clientIp } from "@/lib/kyc/rateLimit";

const bodySchema = contactInfoBaseSchema
  .extend({ customAnswers: customAnswersSchema })
  .superRefine(refineContactInfo);

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
  if (!draftSecretValid(submission, request)) return draftUnauthorized();
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  // Extra runtime guard beyond the zod regex: never persist more than 4
  // digits even if some future client bug sends a full SSN/TIN/EIN.
  const last4 = (value: string | undefined) => value?.slice(-4);

  const data = {
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    phone: body.phone,
    dateOfBirth: new Date(body.dateOfBirth),
    taxIdType: body.taxIdType,
    taxIdLast4: last4(body.taxIdLast4)!,
    streetAddress: body.streetAddress,
    city: body.city,
    state: body.state,
    zipCode: body.zipCode,
    investorType: body.investorType,
    // Only the fields matching the chosen investor type are kept —
    // switching investor type clears out whatever the other group had,
    // rather than leaving stale entity/co-owner data behind.
    entityName: body.investorType === "ENTITY_TRUST" ? body.entityName ?? null : null,
    entityTaxIdLast4: body.investorType === "ENTITY_TRUST" ? last4(body.entityTaxIdLast4) ?? null : null,
    coOwnerFirstName: body.investorType === "JOINT" ? body.coOwnerFirstName ?? null : null,
    coOwnerLastName: body.investorType === "JOINT" ? body.coOwnerLastName ?? null : null,
    coOwnerEmail: body.investorType === "JOINT" ? body.coOwnerEmail ?? null : null,
    coOwnerDateOfBirth:
      body.investorType === "JOINT" && body.coOwnerDateOfBirth ? new Date(body.coOwnerDateOfBirth) : null,
    coOwnerTaxIdType: body.investorType === "JOINT" ? body.coOwnerTaxIdType ?? null : null,
    coOwnerTaxIdLast4: body.investorType === "JOINT" ? last4(body.coOwnerTaxIdLast4) ?? null : null,
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
