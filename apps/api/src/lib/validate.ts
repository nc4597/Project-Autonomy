import type { FastifyReply } from "fastify";
import type { ZodSchema } from "zod";

/**
 * Manual request validation against a Zod schema, replacing what
 * @fastify/type-provider-zod would otherwise do automatically. Dropped
 * that dependency because the only version published (1.0.0) forces
 * Fastify 5 + Zod 4, a much larger upgrade than this app needs — this
 * is the same runtime validation with one extra line per route.
 *
 * On failure, sends a 400 with the flattened Zod error and returns
 * undefined; callers must check for that and return early.
 */
export function parseOrReply<T>(schema: ZodSchema<T>, data: unknown, reply: FastifyReply): T | undefined {
  const result = schema.safeParse(data);
  if (!result.success) {
    reply.status(400).send({ error: "Validation failed", details: result.error.flatten() });
    return undefined;
  }
  return result.data;
}
