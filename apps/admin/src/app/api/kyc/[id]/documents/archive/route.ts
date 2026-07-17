import JSZip from "jszip";
import { NextResponse } from "next/server";
import { kycPrisma } from "@/lib/kyc/prisma";
import { SUBMISSION_INCLUDE } from "@/lib/kyc/serialize";
import { investorFolderName } from "@/lib/kyc/hubspotService";
import { createPresignedDownloadUrl } from "@/lib/kyc/s3Client";

// Already gated by middleware.ts (only /login, /api/auth/login,
// /api/public/*, and /api/health are public) — reaching this route at
// all requires a valid admin session.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const submission = await kycPrisma.verificationSubmission.findUnique({
    where: { id: params.id },
    include: SUBMISSION_INCLUDE,
  });
  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const uploaded = submission.documents.filter((doc) => doc.status === "UPLOADED");
  if (uploaded.length === 0) {
    return NextResponse.json({ error: "No uploaded documents to archive" }, { status: 404 });
  }

  // KYC uploads are a handful of small files, so building the zip in
  // memory is fine; revisit with streaming if uploads ever grow past
  // tens of megabytes.
  const zip = new JSZip();
  const usedNames = new Set<string>();
  try {
    for (const doc of uploaded) {
      const url = await createPresignedDownloadUrl(doc.s3Key);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Fetching ${doc.category} from storage failed: ${response.status}`);
      }
      let name = `${doc.category}_${doc.originalFilename}`.replace(/[^\w.\- ]/g, "_");
      while (usedNames.has(name)) name = `_${name}`;
      usedNames.add(name);
      zip.file(name, await response.arrayBuffer());
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to build archive" },
      { status: 502 }
    );
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${investorFolderName(submission)}.zip"`,
    },
  });
}
