import { NextResponse } from "next/server";
import { kycPrisma } from "@/lib/kyc/prisma";
import { createPresignedDownloadUrl } from "@/lib/kyc/s3Client";

// Already gated by middleware.ts (only /login, /api/auth/login,
// /api/public/*, and /api/health are public) — reaching this route at
// all requires a valid admin session.
export async function GET(
  request: Request,
  { params }: { params: { id: string; docId: string } }
) {
  const document = await kycPrisma.document.findUnique({ where: { id: params.docId } });
  if (!document || document.submissionId !== params.id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    // ?download=1 forces an attachment download; without it the file
    // opens in the browser's viewer (used by the inline preview iframe).
    const wantsDownload = new URL(request.url).searchParams.get("download") === "1";
    const url = await createPresignedDownloadUrl(
      document.s3Key,
      wantsDownload ? `${document.category}_${document.originalFilename}` : undefined
    );
    return NextResponse.redirect(url);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate download link" },
      { status: 502 }
    );
  }
}
