import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildImageKey, createPresignedUploadUrl, publicUrlForKey } from "@/lib/s3Client";

const bodySchema = z.object({
  kind: z.enum(["logo", "thumbnail", "banner", "leadership"]),
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { kind, filename, contentType } = parsed.data;
  const key = buildImageKey(kind, filename);
  const uploadUrl = await createPresignedUploadUrl({ key, contentType });

  return NextResponse.json({ uploadUrl, publicUrl: publicUrlForKey(key) });
}
