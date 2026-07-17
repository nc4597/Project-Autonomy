import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Dedicated endpoint for the About-page team-section copy (edited on
// the Team page) — separate from /api/site-settings so neither form's
// save can overwrite the other's fields.
const bodySchema = z.object({
  teamSectionTitle: z.string().trim().min(1).max(160),
  teamSectionSubtitle: z.string().trim().max(300),
});

export async function PUT(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });
  return NextResponse.json({
    teamSectionTitle: settings.teamSectionTitle,
    teamSectionSubtitle: settings.teamSectionSubtitle,
  });
}
