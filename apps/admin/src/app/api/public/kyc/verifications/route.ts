import { randomUUID } from "node:crypto";
import { kycPrisma } from "@/lib/kyc/prisma";
import { kycLogger } from "@/lib/kyc/logger";
import { createSubmissionSchema } from "@/lib/kyc/schemas";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createSubmissionSchema);
  if (!parsed.ok) return parsed.response;

  const submission = await kycPrisma.verificationSubmission.create({
    // clientSecret goes back to (only) the creating browser — see
    // lib/kyc/draftAuth.ts.
    data: { dealId: parsed.data.dealId, clientSecret: randomUUID() },
  });
  kycLogger.info({ submissionId: submission.id, dealId: submission.dealId }, "draft created");
  return jsonWithCors({ id: submission.id, clientSecret: submission.clientSecret }, { status: 201 });
}
