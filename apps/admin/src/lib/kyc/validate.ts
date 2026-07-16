import type { ZodSchema } from "zod";
import { jsonWithCors } from "./cors";

/** Discriminated result so route handlers can `if (!result.ok) return result.response;` */
export type ParseResult<T> = { ok: true; data: T } | { ok: false; response: Response };

export function parse<T>(schema: ZodSchema<T>, data: unknown): ParseResult<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      ok: false,
      response: jsonWithCors({ error: "Validation failed", details: result.error.flatten() }, { status: 400 }),
    };
  }
  return { ok: true, data: result.data };
}

export async function parseJsonBody<T>(request: Request, schema: ZodSchema<T>): Promise<ParseResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: jsonWithCors({ error: "Request body must be valid JSON" }, { status: 400 }) };
  }
  return parse(schema, body);
}
