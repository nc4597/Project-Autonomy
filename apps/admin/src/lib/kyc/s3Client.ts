import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { env } from "../env";

// Deliberately a separate S3Client/bucket from lib/s3Client.ts (the
// public marketing-asset one) — KYC documents are private and
// compliance-gated, never served through the public asset bucket.
// Lazy singleton: constructing at module load would read env during
// `next build`, where no env vars exist in the Docker build.
let _kycS3: S3Client | null = null;
function kycS3(): S3Client {
  _kycS3 ??= new S3Client({
    region: env.KYC_S3_REGION,
    endpoint: env.KYC_S3_ENDPOINT,
    forcePathStyle: env.KYC_S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.KYC_S3_ACCESS_KEY_ID,
      secretAccessKey: env.KYC_S3_SECRET_ACCESS_KEY,
    },
  });
  return _kycS3;
}

const PRESIGN_TTL_SECONDS = 15 * 60;

export function buildDocumentKey(submissionId: string, category: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  return `verifications/${submissionId}/${category}/${randomUUID()}-${safeName}`;
}

export async function createPresignedUploadUrl(params: { key: string; contentType: string }) {
  // Deliberately not setting ServerSideEncryption here: any header set on
  // the signed command becomes part of the signature, so the browser's
  // PUT request would have to reproduce it exactly or S3 rejects the
  // upload with SignatureDoesNotMatch. Encryption at rest should instead
  // be configured as the bucket's default encryption (SSE-S3/KMS) so it
  // applies to every object regardless of what the client sends.
  const command = new PutObjectCommand({
    Bucket: env.KYC_S3_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });
  return getSignedUrl(kycS3(), command, { expiresIn: PRESIGN_TTL_SECONDS });
}

export async function headObject(key: string) {
  return kycS3().send(new HeadObjectCommand({ Bucket: env.KYC_S3_BUCKET, Key: key }));
}

export async function deleteObject(key: string) {
  await kycS3().send(new DeleteObjectCommand({ Bucket: env.KYC_S3_BUCKET, Key: key }));
}

export async function createPresignedDownloadUrl(key: string, downloadFilename?: string) {
  const command = new GetObjectCommand({
    Bucket: env.KYC_S3_BUCKET,
    Key: key,
    // Forces a save-as instead of the browser's inline viewer, under a
    // readable name rather than the UUID-prefixed storage key.
    ...(downloadFilename
      ? {
          ResponseContentDisposition: `attachment; filename="${downloadFilename.replace(/[^\w.\- ]/g, "_")}"`,
        }
      : {}),
  });
  return getSignedUrl(kycS3(), command, { expiresIn: 5 * 60 });
}
