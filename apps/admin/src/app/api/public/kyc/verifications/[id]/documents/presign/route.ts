import { kycPrisma } from "@/lib/kyc/prisma";
import { presignDocumentSchema } from "@/lib/kyc/schemas";
import { parseJsonBody } from "@/lib/kyc/validate";
import { buildDocumentKey, createPresignedUploadUrl } from "@/lib/kyc/s3Client";
import { jsonWithCors, corsPreflight } from "@/lib/kyc/cors";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const parsed = await parseJsonBody(request, presignDocumentSchema);
  if (!parsed.ok) return parsed.response;
  const { category, filename, mimeType, sizeBytes } = parsed.data;

  const submission = await kycPrisma.verificationSubmission.findUnique({ where: { id: params.id } });
  if (!submission) return jsonWithCors({ error: "Submission not found" }, { status: 404 });
  if (submission.status === "SUBMITTED") {
    return jsonWithCors({ error: "Submission already submitted" }, { status: 409 });
  }

  const s3Key = buildDocumentKey(submission.id, category, filename);

  const document = await kycPrisma.document.create({
    data: {
      submissionId: submission.id,
      category,
      originalFilename: filename,
      mimeType,
      sizeBytes,
      s3Key,
      status: "PENDING",
    },
  });

  const uploadUrl = await createPresignedUploadUrl({ key: s3Key, contentType: mimeType });

  return jsonWithCors({ documentId: document.id, uploadUrl, s3Key }, { status: 201 });
}
