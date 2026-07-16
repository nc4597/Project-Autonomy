import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runHubspotRetrySweep } from "@/lib/kyc/hubspotSyncWorker";

// Lives under /api/public/* so the auth middleware doesn't require an
// admin session cookie to reach it (a Railway Cron Job has no session) —
// it's still gated by its own shared secret below, not left open.
export async function POST(request: Request) {
  if (!env.INTERNAL_SWEEP_SECRET) {
    return NextResponse.json({ error: "Retry sweep is not configured" }, { status: 503 });
  }
  if (request.headers.get("x-internal-secret") !== env.INTERNAL_SWEEP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runHubspotRetrySweep();
  return NextResponse.json(result);
}
