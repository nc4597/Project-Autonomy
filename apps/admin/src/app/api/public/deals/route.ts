import { NextResponse } from "next/server";
import { listDeals } from "@/lib/dealRepository";
import { serializeDeals } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const deals = await listDeals();
  return NextResponse.json({ deals: serializeDeals(deals) });
}
