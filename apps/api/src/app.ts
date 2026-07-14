import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { healthRoutes } from "./routes/health.js";
import { verificationRoutes } from "./routes/verifications.js";
import { documentRoutes } from "./routes/documents.js";
import { internalRoutes } from "./routes/internal.js";

export async function buildApp() {
  const app = Fastify({ loggerInstance: logger });

  await app.register(cors, {
    origin: env.FRONTEND_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(healthRoutes);
  await app.register(verificationRoutes);
  await app.register(documentRoutes);
  await app.register(internalRoutes);

  return app;
}
