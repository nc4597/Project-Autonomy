import { NextResponse } from "next/server";
import { env } from "../env";

// Unlike the existing /api/public/deals etc. (only ever called
// server-side from apps/web's Next.js server, where CORS doesn't apply),
// the KYC wizard's step components are client components — every
// request here comes straight from the investor's browser, a different
// origin than this app. Every response needs these headers, and
// preflight OPTIONS requests need to be answered directly.
// Built per call, not as a module-level const — env is validated
// lazily, and this module gets imported during `next build` where no
// env vars exist yet.
function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": env.FRONTEND_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-draft-secret",
  };
}

export function withCors(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(corsHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

export function corsPreflight(): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }));
}

export function jsonWithCors(body: unknown, init?: ResponseInit): NextResponse {
  return withCors(NextResponse.json(body, init));
}
