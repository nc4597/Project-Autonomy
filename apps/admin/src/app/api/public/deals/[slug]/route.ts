import { NextResponse } from "next/server";
import { getDealBySlug } from "@/lib/dealRepository";
import { serializeDeal } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const deal = await getDealBySlug(params.slug);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }
  return NextResponse.json({ deal: serializeDeal(deal) });
}
