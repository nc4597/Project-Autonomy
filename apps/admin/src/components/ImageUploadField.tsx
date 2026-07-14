"use client";

import { useRef, useState } from "react";

export function ImageUploadField({
  label,
  kind,
  value,
  onChange,
  aspect = "square",
}: {
  label: string;
  kind: "logo" | "thumbnail" | "banner" | "leadership";
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  aspect?: "square" | "wide";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, filename: file.name, contentType: file.type }),
      });
      if (!presignRes.ok) throw new Error("Could not get upload URL");
      const { uploadUrl, publicUrl } = await presignRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Upload failed");

      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-ink-secondary">
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer items-center justify-center overflow-hidden border border-dashed border-hairline bg-page ${
          aspect === "wide" ? "aspect-[3/1]" : "aspect-square w-32"
        }`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-xs text-ink-muted">
            {uploading ? "Uploading..." : "Click to upload"}
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          aria-label={label}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-2 text-xs text-brand-red hover:underline"
        >
          Remove
        </button>
      )}
      {error && <p className="mt-2 text-xs text-brand-red">{error}</p>}
    </div>
  );
}
