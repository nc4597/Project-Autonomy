import { kycPrisma } from "@/lib/kyc/prisma";
import { draftSecretValid, draftUnauthorized } from "@/lib/kyc/draftAuth";
import { kycLogger } from "@/lib/kyc/logger";
import { deleteObject } from "@/lib/kyc/s3Client";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function DELETE(request: Request, { params }: { params: { id: string; docId: string } }) {
  const document = await kycPrisma.document.findUnique({ where: { id: params.docId } });
  if (!document || document.submissionId !== params.id) {
    return jsonWithCors({ error: "Document not found" }, { status: 404 });
  }
  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (!draftSecretValid(submission, request)) return draftUnauthorized();

  await deleteObject(document.s3Key).catch((err) => {
    kycLogger.warn({ documentId: document.id, err: String(err) }, "failed to delete object from storage");
  });
  await kycPrisma.document.delete({ where: { id: document.id } });

  return jsonWithCors({ ok: true });
}
