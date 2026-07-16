import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { parseOrReply } from "../lib/validate.js";
import { createPresignedDownloadUrl } from "../lib/s3Client.js";
import { submissionIdParamsSchema, documentParamsSchema } from "../schemas/verificationSchemas.js";

const SUBMISSION_INCLUDE = {
  contactInfo: true,
  kycAmlInfo: true,
  accreditation: true,
  certification: true,
  documents: true,
  hubspotSync: true,
} as const;

/**
 * Gates the read-only admin routes below with a shared secret (the
 * x-admin-secret header), separate from the public verification API.
 * apps/admin (the internal CMS) calls these server-side to display KYC
 * submissions for compliance review — it never gets direct access to
 * this service's Postgres database, matching the same
 * call-the-API-not-the-database boundary apps/web uses.
 */
function requireAdminSecret(request: FastifyRequest, reply: FastifyReply): boolean {
  if (!env.ADMIN_API_SECRET) {
    request.log.warn("admin route called but ADMIN_API_SECRET is not configured; rejecting");
    reply.status(503).send({ error: "Admin API is not configured" });
    return false;
  }
  if (request.headers["x-admin-secret"] !== env.ADMIN_API_SECRET) {
    reply.status(401).send({ error: "Unauthorized" });
    return false;
  }
  return true;
}

function summarize(submission: {
  id: string;
  dealId: string;
  status: string;
  createdAt: Date;
  submittedAt: Date | null;
  contactInfo: { firstName: string; lastName: string; email: string; investorType: string } | null;
  accreditation: { method: string } | null;
  hubspotSync: { status: string } | null;
}) {
  return {
    id: submission.id,
    dealId: submission.dealId,
    status: submission.status,
    createdAt: submission.createdAt,
    submittedAt: submission.submittedAt,
    investorName: submission.contactInfo
      ? `${submission.contactInfo.firstName} ${submission.contactInfo.lastName}`
      : null,
    email: submission.contactInfo?.email ?? null,
    investorType: submission.contactInfo?.investorType ?? null,
    accreditationMethod: submission.accreditation?.method ?? null,
    hubspotSyncStatus: submission.hubspotSync?.status ?? "NOT_CONFIGURED",
  };
}

const listQuerySchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED"]).optional(),
});

export async function adminRoutes(app: FastifyInstance) {
  app.get("/api/admin/verifications", async (request, reply) => {
    if (!requireAdminSecret(request, reply)) return;
    const query = parseOrReply(listQuerySchema, request.query, reply);
    if (!query) return;

    const submissions = await prisma.verificationSubmission.findMany({
      where: query.status ? { status: query.status } : undefined,
      include: SUBMISSION_INCLUDE,
      orderBy: [{ submittedAt: "desc" }, { createdAt: "desc" }],
      take: 200,
    });

    return reply.send({ submissions: submissions.map(summarize) });
  });

  app.get("/api/admin/verifications/:id", async (request, reply) => {
    if (!requireAdminSecret(request, reply)) return;
    const params = parseOrReply(submissionIdParamsSchema, request.params, reply);
    if (!params) return;

    const submission = await prisma.verificationSubmission.findUnique({
      where: { id: params.id },
      include: SUBMISSION_INCLUDE,
    });
    if (!submission) return reply.status(404).send({ error: "Submission not found" });

    // Unlike the investor-facing GET /api/verifications/:id, this is the
    // internal compliance view — SSN last-4 and date of birth are
    // legitimately part of what a reviewer needs to see here, so nothing
    // is stripped the way it deliberately is for the HubSpot payload.
    return reply.send({
      id: submission.id,
      dealId: submission.dealId,
      status: submission.status,
      createdAt: submission.createdAt,
      submittedAt: submission.submittedAt,
      contactInfo: submission.contactInfo
        ? { ...submission.contactInfo, dateOfBirth: submission.contactInfo.dateOfBirth.toISOString().slice(0, 10) }
        : null,
      kycAmlInfo: submission.kycAmlInfo,
      accreditation: submission.accreditation,
      certification: submission.certification,
      documents: submission.documents.map((doc) => ({
        id: doc.id,
        category: doc.category,
        originalFilename: doc.originalFilename,
        status: doc.status,
        rejectionReason: doc.rejectionReason,
        createdAt: doc.createdAt,
        confirmedAt: doc.confirmedAt,
      })),
      hubspotSync: submission.hubspotSync,
    });
  });

  // Short-lived download link for one document, generated on demand
  // rather than up front — the list/detail views above only ever show
  // metadata, so a reviewer has to deliberately open a specific document
  // before a signed URL for it even exists.
  app.get("/api/admin/verifications/:id/documents/:docId/download", async (request, reply) => {
    if (!requireAdminSecret(request, reply)) return;
    const params = parseOrReply(documentParamsSchema, request.params, reply);
    if (!params) return;

    const document = await prisma.document.findUnique({ where: { id: params.docId } });
    if (!document || document.submissionId !== params.id) {
      return reply.status(404).send({ error: "Document not found" });
    }

    const url = await createPresignedDownloadUrl(document.s3Key);
    return reply.send({ url, originalFilename: document.originalFilename, mimeType: document.mimeType });
  });
}
