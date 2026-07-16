import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { env } from "./env";

// Lazy singleton — constructing this at module load would read env
// during `next build` (where no env vars exist in the Docker build).
let _s3: S3Client | null = null;
function s3(): S3Client {
  _s3 ??= new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
  return _s3;
}

const PRESIGN_TTL_SECONDS = 15 * 60;

export type ImageKind = "logo" | "thumbnail" | "banner" | "leadership" | "team";

export function buildImageKey(kind: ImageKind, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  // "site-assets" rather than "deal-assets" — this now covers team
  // photos too, not just deal-scoped images. Pre-existing objects keep
  // working regardless (their full URL is stored in the DB, not
  // reconstructed from this prefix).
  return `site-assets/${kind}/${randomUUID()}-${safeName}`;
}

// These images are public-read marketing assets (deal logos, thumbnails,
// banners, leadership photos), not the compliance-gated KYC documents
// lib/kyc/s3Client.ts handles — so uploads still go through a short-lived presigned
// URL (avoids routing large binaries through this server), but reads are
// just a stable public URL, not a presigned one that expires.
export async function createPresignedUploadUrl(params: { key: string; contentType: string }) {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });
  return getSignedUrl(s3(), command, { expiresIn: PRESIGN_TTL_SECONDS });
}

export function publicUrlForKey(key: string) {
  return `${env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

export async function deleteObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}
