import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { parseOrReply } from "../lib/validate.js";
import {
  presignDocumentSchema,
  submissionIdParamsSchema,
  documentParamsSchema,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from "../schemas/verificationSchemas.js";
import { buildDocumentKey, createPresignedUploadUrl, headObject, deleteObject } from "../lib/s3Client.js";

export async function documentRoutes(app: FastifyInstance) {
  app.post("/api/verifications/:id/documents/presign", async (request, reply) => {
    const params = parseOrReply(submissionIdParamsSchema, request.params, reply);
    if (!params) return;
    const body = parseOrReply(presignDocumentSchema, request.body, reply);
    if (!body) return;

    const submission = await prisma.verificationSubmission.findUnique({
      where: { id: params.id },
    });
    if (!submission) return reply.status(404).send({ error: "Submission not found" });
    if (submission.status === "SUBMITTED") {
      return reply.status(409).send({ error: "Submission already submitted" });
    }

    const { category, filename, mimeType, sizeBytes } = body;
    const s3Key = buildDocumentKey(submission.id, category, filename);

    const document = await prisma.document.create({
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

    return reply.status(201).send({ documentId: document.id, uploadUrl, s3Key });
  });

  app.post("/api/verifications/:id/documents/:docId/confirm", async (request, reply) => {
    const params = parseOrReply(documentParamsSchema, request.params, reply);
    if (!params) return;

    const document = await prisma.document.findUnique({ where: { id: params.docId } });
    if (!document || document.submissionId !== params.id) {
      return reply.status(404).send({ error: "Document not found" });
    }

    try {
      const head = await headObject(document.s3Key);

      const contentType = head.ContentType ?? "";
      if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(contentType)) {
        await prisma.document.update({
          where: { id: document.id },
          data: { status: "REJECTED", rejectionReason: `Disallowed content type: ${contentType}` },
        });
        return reply.status(422).send({ error: "Uploaded file has a disallowed content type" });
      }

      const size = head.ContentLength ?? 0;
      if (size > MAX_UPLOAD_SIZE_BYTES) {
        await prisma.document.update({
          where: { id: document.id },
          data: { status: "REJECTED", rejectionReason: `File too large: ${size} bytes` },
        });
        return reply.status(422).send({ error: "Uploaded file exceeds the 25MB limit" });
      }

      const confirmed = await prisma.document.update({
        where: { id: document.id },
        data: { status: "UPLOADED", sizeBytes: size, confirmedAt: new Date(), rejectionReason: null },
      });

      return reply.send({ ok: true, status: confirmed.status });
    } catch (err) {
      logger.error({ documentId: document.id, err: String(err) }, "document confirm failed: object not found in storage");
      await prisma.document.update({
        where: { id: document.id },
        data: { status: "REJECTED", rejectionReason: "Upload not found in storage" },
      });
      return reply.status(422).send({ error: "Upload could not be verified in storage" });
    }
  });

  app.delete("/api/verifications/:id/documents/:docId", async (request, reply) => {
    const params = parseOrReply(documentParamsSchema, request.params, reply);
    if (!params) return;

    const document = await prisma.document.findUnique({ where: { id: params.docId } });
    if (!document || document.submissionId !== params.id) {
      return reply.status(404).send({ error: "Document not found" });
    }

    await deleteObject(document.s3Key).catch((err) => {
      logger.warn({ documentId: document.id, err: String(err) }, "failed to delete object from storage");
    });
    await prisma.document.delete({ where: { id: document.id } });

    return reply.send({ ok: true });
  });
}
