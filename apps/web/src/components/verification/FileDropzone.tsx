"use client";

import { useRef, useState } from "react";
import type { DocumentCategory } from "../../lib/constants/verification";
import { ACCEPTED_UPLOAD_LABEL, MAX_UPLOAD_SIZE_LABEL } from "../../lib/constants/verification";
import { useFileUpload } from "../../lib/hooks/useFileUpload";
import { useVerificationStore } from "../../lib/state/verificationStore";

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-ink-muted" aria-hidden="true">
      <path
        d="M12 16V4M12 4L7 9M12 4L17 9M5 16v2a2 2 0 002 2h10a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-success" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 10.5L8.75 12.75L13.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FileDropzone({
  submissionId,
  category,
  title,
  helperText,
  optional = false,
}: {
  submissionId: string | null;
  category: DocumentCategory;
  title: string;
  helperText?: string;
  optional?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { state, errorMessage, upload, remove } = useFileUpload(submissionId, category);
  const existingDocument = useVerificationStore((s) =>
    s.draft?.documents.find((doc) => doc.category === category && doc.status !== "REJECTED")
  );

  const isUploaded = Boolean(existingDocument) && state !== "uploading";

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) void upload(file);
  }

  if (isUploaded && existingDocument) {
    return (
      <div className="flex items-center justify-between border border-hairline bg-page px-6 py-4">
        <div className="flex items-start gap-2">
          <CheckCircleIcon />
          <div>
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="mt-0.5 text-xs text-success">{existingDocument.originalFilename} &middot; Uploaded</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => remove(existingDocument.id)}
          className="text-xs font-medium uppercase tracking-wide text-brand-red hover:text-brand-red-dark"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={[
          "border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragOver ? "border-brand-red bg-brand-red/5" : "border-hairline bg-card",
        ].join(" ")}
      >
        <div className="flex flex-col items-center gap-2">
          <UploadIcon />
          <p className="text-sm font-semibold text-ink">
            {title} {optional && <span className="font-normal text-ink-muted">(optional)</span>}
          </p>
          <p className="text-xs text-ink-secondary">
            {state === "uploading" ? (
              "Uploading..."
            ) : (
              <>
                Drag &amp; drop or{" "}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-brand-red underline"
                >
                  click to upload
                </button>
              </>
            )}
          </p>
          <p className="text-xs text-ink-muted">
            {ACCEPTED_UPLOAD_LABEL} &middot; Max {MAX_UPLOAD_SIZE_LABEL}
          </p>
          {helperText && <p className="text-xs text-ink-muted">{helperText}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {state === "error" && errorMessage && (
        <p className="mt-1 text-xs text-brand-red">{errorMessage}</p>
      )}
    </div>
  );
}
