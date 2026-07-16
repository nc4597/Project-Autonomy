import type { NextRequest } from "next/server";
import { kycPrisma } from "@/lib/kyc/prisma";
import { certificationSchema } from "@/lib/kyc/schemas";
import { parseJsonBody } from "@/lib/kyc/validate";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const parsed = await parseJsonBody(request, certificationSchema);
  if (!parsed.ok) return parsed.response;

  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  const ipAddress = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const data = { acceptedAt: new Date(), tosVersion: parsed.data.tosVersion, ipAddress, userAgent };

  await kycPrisma.certificationAcceptance.upsert({
    where: { submissionId: submission.id },
    create: { submissionId: submission.id, ...data },
    update: data,
  });

  return jsonWithCors({ ok: true });
}
