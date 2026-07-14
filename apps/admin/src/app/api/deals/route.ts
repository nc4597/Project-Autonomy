import { NextRequest, NextResponse } from "next/server";
import { createDeal, listDeals } from "@/lib/dealRepository";
import { dealInputSchema } from "@/lib/dealSchema";
import { prisma } from "@/lib/prisma";
import { serializeDeal, serializeDeals } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const deals = await listDeals();
  return NextResponse.json({ deals: serializeDeals(deals) });
}

export async function POST(request: NextRequest) {
  const parsed = dealInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.deal.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "A deal with this slug already exists" }, { status: 409 });
  }

  const deal = await createDeal(parsed.data);
  return NextResponse.json({ deal: serializeDeal(deal) }, { status: 201 });
}
