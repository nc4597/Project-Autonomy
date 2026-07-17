import { kycPrisma } from "@/lib/kyc/prisma";
import { draftSecretValid, draftUnauthorized } from "@/lib/kyc/draftAuth";
import { kycLogger } from "@/lib/kyc/logger";
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "@/lib/kyc/schemas";
import { headObject } from "@/lib/kyc/s3Client";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request, { params }: { params: { id: string; docId: string } }) {
  const document = await kycPrisma.document.findUnique({ where: { id: params.docId } });
  if (!document || document.submissionId !== params.id) {
    return jsonWithCors({ error: "Document not found" }, { status: 404 });
  }
  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (!draftSecretValid(submission, request)) return draftUnauthorized();

  try {
    const head = await headObject(document.s3Key);

    const contentType = head.ContentType ?? "";
    if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(contentType)) {
      await kycPrisma.document.update({
        where: { id: document.id },
        data: { status: "REJECTED", rejectionReason: `Disallowed content type: ${contentType}` },
      });
      return jsonWithCors({ error: "Uploaded file has a disallowed content type" }, { status: 422 });
    }

    const size = head.ContentLength ?? 0;
    if (size > MAX_UPLOAD_SIZE_BYTES) {
      await kycPrisma.document.update({
        where: { id: document.id },
        data: { status: "REJECTED", rejectionReason: `File too large: ${size} bytes` },
      });
      return jsonWithCors({ error: "Uploaded file exceeds the 25MB limit" }, { status: 422 });
    }

    const confirmed = await kycPrisma.document.update({
      where: { id: document.id },
      data: { status: "UPLOADED", sizeBytes: size, confirmedAt: new Date(), rejectionReason: null },
    });

    return jsonWithCors({ ok: true, status: confirmed.status });
  } catch (err) {
    kycLogger.error(
      { documentId: document.id, err: String(err) },
      "document confirm failed: object not found in storage"
    );
    await kycPrisma.document.update({
      where: { id: document.id },
      data: { status: "REJECTED", rejectionReason: "Upload not found in storage" },
    });
    return jsonWithCors({ error: "Upload could not be verified in storage" }, { status: 422 });
  }
}
