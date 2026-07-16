import { NextResponse } from "next/server";
import { env } from "../env";

// Unlike the existing /api/public/deals etc. (only ever called
// server-side from apps/web's Next.js server, where CORS doesn't apply),
// the KYC wizard's step components are client components — every
// request here comes straight from the investor's browser, a different
// origin than this app. Every response needs these headers, and
// preflight OPTIONS requests need to be answered directly.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": env.FRONTEND_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function withCors(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
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
