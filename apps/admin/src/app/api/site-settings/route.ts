import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings, updateSiteSettings } from "@/lib/dealRepository";
import { siteSettingsInputSchema } from "@/lib/dealSchema";
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

export async function PUT(request: NextRequest) {
  const parsed = siteSettingsInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await updateSiteSettings(parsed.data);
  return NextResponse.json({
    ...settings,
    featuredDeal: settings.featuredDeal ? serializeDeal(settings.featuredDeal) : null,
    featuredClosedDeals: settings.featuredClosedDeals.map(serializeDeal),
  });
}
