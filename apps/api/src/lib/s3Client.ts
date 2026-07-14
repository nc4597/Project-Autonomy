import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

export const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});

const PRESIGN_TTL_SECONDS = 15 * 60;

export function buildDocumentKey(submissionId: string, category: string, filename: string) {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  return `verifications/${submissionId}/${category}/${randomUUID()}-${safeName}`;
}

export async function createPresignedUploadUrl(params: {
  key: string;
  contentType: string;
}) {
  // Deliberately not setting ServerSideEncryption here: any header set on
  // the signed command becomes part of the signature, so the browser's
  // PUT request would have to reproduce it exactly or S3 rejects the
  // upload with SignatureDoesNotMatch. Encryption at rest should instead
  // be configured as the bucket's default encryption (SSE-S3/KMS) so it
  // applies to every object regardless of what the client sends.
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: PRESIGN_TTL_SECONDS });
}

export async function headObject(key: string) {
  return s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}

export async function deleteObject(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}

export async function createPresignedDownloadUrl(key: string) {
  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn: 5 * 60 });
}
