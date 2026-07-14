import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "@fastify/type-provider-zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import {
  createSubmissionSchema,
  contactInfoSchema,
  kycAmlInfoSchema,
  accreditationInfoSchema,
  certificationSchema,
  submissionIdParamsSchema,
} from "../schemas/verificationSchemas.js";
import { syncSubmissionToHubspot } from "../services/hubspotService.js";
import { validateSubmissionCompleteness } from "../services/submissionValidation.js";

const SUBMISSION_INCLUDE = {
  contactInfo: true,
  kycAmlInfo: true,
  accreditation: true,
  certification: true,
  documents: true,
  hubspotSync: true,
} as const;

type SubmissionWithRelations = Prisma.VerificationSubmissionGetPayload<{
  include: typeof SUBMISSION_INCLUDE;
}>;

function serializeSubmission(submission: SubmissionWithRelations) {
  return {
    id: submission.id,
    dealId: submission.dealId,
    status: submission.status,
    currentStep: submission.currentStep,
    contactInfo: submission.contactInfo
      ? {
          ...submission.contactInfo,
          dateOfBirth: submission.contactInfo.dateOfBirth.toISOString().slice(0, 10),
        }
      : null,
    kycAmlInfo: submission.kycAmlInfo,
    accreditation: submission.accreditation,
    certification: submission.certification,
    documents: submission.documents.map((doc) => ({
      id: doc.id,
      category: doc.category,
      originalFilename: doc.originalFilename,
      status: doc.status,
      createdAt: doc.createdAt,
    })),
    hubspotSyncStatus: submission.hubspotSync?.status ?? "NOT_CONFIGURED",
  };
}

async function loadSubmission(id: string) {
  return prisma.verificationSubmission.findUnique({
    where: { id },
    include: SUBMISSION_INCLUDE,
  });
}

export async function verificationRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    "/api/verifications",
    { schema: { body: createSubmissionSchema } },
    async (request, reply) => {
      const submission = await prisma.verificationSubmission.create({
        data: { dealId: request.body.dealId },
      });
      logger.info({ submissionId: submission.id, dealId: submission.dealId }, "draft created");
      return reply.status(201).send({ id: submission.id });
    }
  );

  server.get(
    "/api/verifications/:id",
    { schema: { params: submissionIdParamsSchema } },
    async (request, reply) => {
      const submission = await loadSubmission(request.params.id);
      if (!submission) return reply.status(404).send({ error: "Submission not found" });
      return reply.send(serializeSubmission(submission));
    }
  );

  server.patch(
    "/api/verifications/:id/contact-info",
    { schema: { params: submissionIdParamsSchema, body: contactInfoSchema } },
    async (request, reply) => {
      const submission = await loadSubmission(request.params.id);
      if (!submission) return reply.status(404).send({ error: "Submission not found" });
      if (submission.status === "SUBMITTED") {
        return reply.status(409).send({ error: "Submission already submitted" });
      }

      const body = request.body;
      // Extra runtime guard beyond the zod regex: never persist more than
      // 4 digits even if some future client bug sends a full SSN.
      const ssnLast4 = body.ssnLast4.slice(-4);

      await prisma.contactInfo.upsert({
        where: { submissionId: submission.id },
        create: {
          submissionId: submission.id,
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
        },
        update: {
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
        },
      });

      await prisma.verificationSubmission.update({
        where: { id: submission.id },
        data: { currentStep: Math.max(submission.currentStep, 2) },
      });

      return reply.send({ ok: true });
    }
  );

  server.patch(
    "/api/verifications/:id/kyc-aml",
    { schema: { params: submissionIdParamsSchema, body: kycAmlInfoSchema } },
    async (request, reply) => {
      const submission = await loadSubmission(request.params.id);
      if (!submission) return reply.status(404).send({ error: "Submission not found" });
      if (submission.status === "SUBMITTED") {
        return reply.status(409).send({ error: "Submission already submitted" });
      }

      const body = request.body;
      await prisma.kycAmlInfo.upsert({
        where: { submissionId: submission.id },
        create: { submissionId: submission.id, ...body },
        update: { ...body },
      });

      await prisma.verificationSubmission.update({
        where: { id: submission.id },
        data: { currentStep: Math.max(submission.currentStep, 3) },
      });

      return reply.send({ ok: true });
    }
  );

  server.patch(
    "/api/verifications/:id/accreditation",
    { schema: { params: submissionIdParamsSchema, body: accreditationInfoSchema } },
    async (request, reply) => {
      const submission = await loadSubmission(request.params.id);
      if (!submission) return reply.status(404).send({ error: "Submission not found" });
      if (submission.status === "SUBMITTED") {
        return reply.status(409).send({ error: "Submission already submitted" });
      }

      await prisma.accreditationInfo.upsert({
        where: { submissionId: submission.id },
        create: { submissionId: submission.id, method: request.body.method },
        update: { method: request.body.method },
      });

      await prisma.verificationSubmission.update({
        where: { id: submission.id },
        data: { currentStep: Math.max(submission.currentStep, 4) },
      });

      return reply.send({ ok: true });
    }
  );

  server.post(
    "/api/verifications/:id/certification",
    { schema: { params: submissionIdParamsSchema, body: certificationSchema } },
    async (request, reply) => {
      const submission = await loadSubmission(request.params.id);
      if (!submission) return reply.status(404).send({ error: "Submission not found" });
      if (submission.status === "SUBMITTED") {
        return reply.status(409).send({ error: "Submission already submitted" });
      }

      await prisma.certificationAcceptance.upsert({
        where: { submissionId: submission.id },
        create: {
          submissionId: submission.id,
          acceptedAt: new Date(),
          tosVersion: request.body.tosVersion,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? "unknown",
        },
        update: {
          acceptedAt: new Date(),
          tosVersion: request.body.tosVersion,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"] ?? "unknown",
        },
      });

      return reply.send({ ok: true });
    }
  );

  server.post(
    "/api/verifications/:id/submit",
    { schema: { params: submissionIdParamsSchema } },
    async (request, reply) => {
      const submission = await loadSubmission(request.params.id);
      if (!submission) return reply.status(404).send({ error: "Submission not found" });
      if (submission.status === "SUBMITTED") {
        return reply.status(409).send({ error: "Submission already submitted" });
      }

      const errors = validateSubmissionCompleteness(submission);
      if (errors.length > 0) {
        return reply.status(422).send({ error: "Submission is incomplete", details: errors });
      }

      const updated = await prisma.verificationSubmission.update({
        where: { id: submission.id },
        data: { status: "SUBMITTED", submittedAt: new Date() },
      });

      // Fire-and-forget: HubSpot is never on the critical path for the
      // investor's success response. Postgres is already durable.
      syncSubmissionToHubspot(updated.id).catch((err) => {
        logger.error({ submissionId: updated.id, err: String(err) }, "unhandled hubspot sync error");
      });

      logger.info({ submissionId: updated.id }, "submission submitted");
      return reply.send({ ok: true, submittedAt: updated.submittedAt });
    }
  );
}
