"use client";

import { useCallback, useState } from "react";
import {
  presignDocument,
  uploadToPresignedUrl,
  confirmDocument,
  deleteDocument,
} from "../api/verificationClient";
import type { DocumentCategory } from "../constants/verification";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_LABEL,
} from "../constants/verification";
import { useVerificationStore } from "../state/verificationStore";

export type UploadState = "idle" | "uploading" | "uploaded" | "error";

export function useFileUpload(submissionId: string | null, category: DocumentCategory) {
  const [state, setState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const upsertDocument = useVerificationStore((s) => s.upsertDocument);
  const removeDocumentFromStore = useVerificationStore((s) => s.removeDocument);

  const upload = useCallback(
    async (file: File) => {
      if (!submissionId) return;

      if (!(ALLOWED_UPLOAD_MIME_TYPES as readonly string[]).includes(file.type)) {
        setState("error");
        setErrorMessage("Only PDF, JPG, or PNG files are accepted");
        return;
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        setState("error");
        setErrorMessage(`File exceeds the ${MAX_UPLOAD_SIZE_LABEL} limit`);
        return;
      }

      setState("uploading");
      setErrorMessage(null);

      try {
        const { documentId, uploadUrl } = await presignDocument(submissionId, {
          category,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        });

        await uploadToPresignedUrl(uploadUrl, file);
        const confirmed = await confirmDocument(submissionId, documentId);

        upsertDocument({
          id: documentId,
          category,
          originalFilename: file.name,
          status: confirmed.status as "UPLOADED",
          createdAt: new Date().toISOString(),
        });
        setState("uploaded");
      } catch (err) {
        setState("error");
        setErrorMessage(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [submissionId, category, upsertDocument]
  );

  const remove = useCallback(
    async (documentId: string) => {
      if (!submissionId) return;
      await deleteDocument(submissionId, documentId);
      removeDocumentFromStore(documentId);
      setState("idle");
    },
    [submissionId, removeDocumentFromStore]
  );

  return { state, errorMessage, upload, remove };
}
