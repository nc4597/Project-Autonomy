import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";
import { runHubspotRetrySweep } from "../services/hubspotSyncWorker.js";

/**
 * Target for a Railway Cron Job (e.g. every 15 minutes) that retries
 * HubSpot syncs left in FAILED or NOT_CONFIGURED state. Guarded by a
 * shared secret so it isn't a publicly triggerable endpoint.
 */
export async function internalRoutes(app: FastifyInstance) {
  app.post("/internal/hubspot/retry-sweep", async (request, reply) => {
    if (!env.INTERNAL_SWEEP_SECRET) {
      app.log.warn("retry-sweep called but INTERNAL_SWEEP_SECRET is not configured; rejecting");
      return reply.status(503).send({ error: "Retry sweep is not configured" });
    }

    const provided = request.headers["x-internal-secret"];
    if (provided !== env.INTERNAL_SWEEP_SECRET) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const result = await runHubspotRetrySweep();
    return reply.send(result);
  });
}
