import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({ status: "ok", db: "connected" });
    } catch (err) {
      app.log.error({ err }, "health check failed: database unreachable");
      return reply.status(503).send({ status: "error", db: "unreachable" });
    }
  });
}
