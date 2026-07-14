import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { parseOrReply } from "../lib/validate.js";
import {
  createSubmissionSchema,
  contactInfoSchema,
  kycAmlInfoSchema,
  accreditationInfoSchema,
  certificationSchema,
  submissionIdParamsSchema,
} from "../schemas/verificationSchemas.js";
import { submitToHubspotForm } from "../services/hubspotFormService.js";
import { notifyAdminsOfSubmission } from "../services/adminNotificationService.js";
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
  app.post("/api/verifications", async (request, reply) => {
    const body = parseOrReply(createSubmissionSchema, request.body, reply);
    if (!body) return;

    const submission = await prisma.verificationSubmission.create({
      data: { dealId: body.dealId },
    });
    logger.info({ submissionId: submission.id, dealId: submission.dealId }, "draft created");
    return reply.status(201).send({ id: submission.id });
  });

  app.get("/api/verifications/:id", async (request, reply) => {
    const params = parseOrReply(submissionIdParamsSchema, request.params, reply);
    if (!params) return;

    const submission = await loadSubmission(params.id);
    if (!submission) return reply.status(404).send({ error: "Submission not found" });
    return reply.send(serializeSubmission(submission));
  });

  app.patch("/api/verifications/:id/contact-info", async (request, reply) => {
    const params = parseOrReply(submissionIdParamsSchema, request.params, reply);
    if (!params) return;
    const body = parseOrReply(contactInfoSchema, request.body, reply);
    if (!body) return;

    const submission = await loadSubmission(params.id);
    if (!submission) return reply.status(404).send({ error: "Submission not found" });
    if (submission.status === "SUBMITTED") {
      return reply.status(409).send({ error: "Submission already submitted" });
    }

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
  });

  app.patch("/api/verifications/:id/kyc-aml", async (request, reply) => {
    const params = parseOrReply(submissionIdParamsSchema, request.params, reply);
    if (!params) return;
    const body = parseOrReply(kycAmlInfoSchema, request.body, reply);
    if (!body) return;

    const submission = await loadSubmission(params.id);
    if (!submission) return reply.status(404).send({ error: "Submission not found" });
    if (submission.status === "SUBMITTED") {
      return reply.status(409).send({ error: "Submission already submitted" });
    }

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
  });

  app.patch("/api/verifications/:id/accreditation", async (request, reply) => {
    const params = parseOrReply(submissionIdParamsSchema, request.params, reply);
    if (!params) return;
    const body = parseOrReply(accreditationInfoSchema, request.body, reply);
    if (!body) return;

    const submission = await loadSubmission(params.id);
    if (!submission) return reply.status(404).send({ error: "Submission not found" });
    if (submission.status === "SUBMITTED") {
      return reply.status(409).send({ error: "Submission already submitted" });
    }

    await prisma.accreditationInfo.upsert({
      where: { submissionId: submission.id },
      create: { submissionId: submission.id, method: body.method },
      update: { method: body.method },
    });

    await prisma.verificationSubmission.update({
      where: { id: submission.id },
      data: { currentStep: Math.max(submission.currentStep, 4) },
    });

    return reply.send({ ok: true });
  });

  app.post("/api/verifications/:id/certification", async (request, reply) => {
    const params = parseOrReply(submissionIdParamsSchema, request.params, reply);
    if (!params) return;
    const body = parseOrReply(certificationSchema, request.body, reply);
    if (!body) return;

    const submission = await loadSubmission(params.id);
    if (!submission) return reply.status(404).send({ error: "Submission not found" });
    if (submission.status === "SUBMITTED") {
      return reply.status(409).send({ error: "Submission already submitted" });
    }

    await prisma.certificationAcceptance.upsert({
      where: { submissionId: submission.id },
      create: {
        submissionId: submission.id,
        acceptedAt: new Date(),
        tosVersion: body.tosVersion,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] ?? "unknown",
      },
      update: {
        acceptedAt: new Date(),
        tosVersion: body.tosVersion,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"] ?? "unknown",
      },
    });

    return reply.send({ ok: true });
  });

  app.post("/api/verifications/:id/submit", async (request, reply) => {
    const params = parseOrReply(submissionIdParamsSchema, request.params, reply);
    if (!params) return;

    const submission = await loadSubmission(params.id);
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
    // Active path is the native HubSpot Form submission; the
    // contact-record path (services/hubspotService.ts) is built and
    // ready — add `syncSubmissionToHubspot(updated.id)` here too
    // whenever both should run.
    submitToHubspotForm(updated.id).catch((err) => {
      logger.error({ submissionId: updated.id, err: String(err) }, "unhandled hubspot form submission error");
    });
    notifyAdminsOfSubmission(updated.id).catch((err) => {
      logger.error({ submissionId: updated.id, err: String(err) }, "unhandled admin notification error");
    });

    logger.info({ submissionId: updated.id }, "submission submitted");
    return reply.send({ ok: true, submittedAt: updated.submittedAt });
  });
}
