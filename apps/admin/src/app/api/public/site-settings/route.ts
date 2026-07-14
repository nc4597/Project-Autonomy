import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/dealRepository";
import { serializeDeal } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({
    ...settings,
    featuredDeal: settings.featuredDeal ? serializeDeal(settings.featuredDeal) : null,
    featuredClosedDeals: settings.featuredClosedDeals.map(serializeDeal),
  });
}
