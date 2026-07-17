"use client";

import { useState } from "react";

/**
 * One row in the Documents section: label, status chip, and — for
 * uploaded files — an inline preview toggle plus a download link. The
 * preview iframe hits our download route, which redirects to a
 * short-lived signed R2 URL; the browser's built-in viewer handles PDFs
 * and images alike. The iframe only mounts while open, so collapsed
 * rows never spend a presigned URL.
 */
export function KycDocumentRow({
  submissionId,
  docId,
  label,
  filename,
  status,
  statusClassName,
}: {
  submissionId: string;
  docId: string;
  label: string;
  filename: string;
  status: string;
  statusClassName: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileUrl = `/api/kyc/${submissionId}/documents/${docId}/download`;

  return (
    <div className="border-b border-hairline last:border-0">
      <div className="flex items-center justify-between gap-3 py-2.5">
        <div>
          <div className="text-sm font-medium text-ink">{label}</div>
          <div className="text-xs text-ink-secondary">{filename}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-[11px] font-semibold uppercase ${statusClassName}`}>{status}</span>
          {status === "UPLOADED" && (
            <>
              <button
                type="button"
                onClick={() => setPreviewOpen((open) => !open)}
                aria-expanded={previewOpen}
                className="text-xs font-semibold uppercase text-navy-950 hover:underline"
              >
                {previewOpen ? "Hide Preview" : "Preview"}
              </button>
              <a
                href={`${fileUrl}?download=1`}
                className="text-xs font-semibold uppercase text-navy-950 hover:underline"
              >
                Download
              </a>
            </>
          )}
        </div>
      </div>
      {previewOpen && (
        <div className="mb-3 border border-hairline">
          <div className="flex items-center justify-between gap-3 border-b border-hairline bg-page px-3 py-2">
            <span className="text-xs text-ink-secondary">{filename}</span>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold uppercase text-navy-950 hover:underline"
            >
              Open in New Tab
            </a>
          </div>
          <iframe src={fileUrl} title={`Preview of ${label}`} className="h-[460px] w-full bg-white" />
        </div>
      )}
    </div>
  );
}
