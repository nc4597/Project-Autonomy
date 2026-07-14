import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Gates the admin UI and write API routes. Deliberately a single shared
  // secret for now rather than per-user accounts — see middleware.ts.
  ADMIN_PASSWORD: z.string().min(1, "ADMIN_PASSWORD is required"),
  ADMIN_SESSION_SECRET: z.string().min(1, "ADMIN_SESSION_SECRET is required"),

  // Origin(s) allowed to call the public read endpoints (apps/web).
  FRONTEND_ORIGIN: z.string().url(),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  // Distinct from apps/api's KYC documents bucket: these assets (deal
  // logos, thumbnails, banners, leadership photos) are public-read
  // marketing images, not compliance-gated documents.
  S3_BUCKET: z.string().min(1, "S3_BUCKET is required"),
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID is required"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY is required"),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  // Public base URL images are served from once uploaded, e.g. the
  // MinIO console's public endpoint or a CDN in front of the bucket.
  S3_PUBLIC_URL: z.string().min(1, "S3_PUBLIC_URL is required"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

export const env = loadEnv();
