import { NextRequest, NextResponse } from "next/server";
import { deleteDeal, getDealById, updateDeal } from "@/lib/dealRepository";
import { dealInputSchema } from "@/lib/dealSchema";
import { prisma } from "@/lib/prisma";
import { serializeDeal } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const deal = await getDealById(params.id);
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }
  return NextResponse.json({ deal: serializeDeal(deal) });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const parsed = dealInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const slugOwner = await prisma.deal.findUnique({ where: { slug: parsed.data.slug } });
  if (slugOwner && slugOwner.id !== params.id) {
    return NextResponse.json({ error: "A deal with this slug already exists" }, { status: 409 });
  }

  const deal = await updateDeal(params.id, parsed.data);
  return NextResponse.json({ deal: serializeDeal(deal) });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await deleteDeal(params.id);
  return NextResponse.json({ ok: true });
}
