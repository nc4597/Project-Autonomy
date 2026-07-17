import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Origin allowed to call the public read endpoints (apps/web) — both
  // the CMS content routes and the KYC investor-facing routes below,
  // since apps/web's wizard calls those directly from the browser.
  FRONTEND_ORIGIN: z.string().url(),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  // Marketing assets (deal logos, thumbnails, banners, leadership
  // photos) — public-read images, not compliance-gated documents. See
  // the separate KYC_S3_* bucket below for those.
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

  // ---- KYC/AML verification flow (merged in from the former apps/api) ----
  // Own database, kept deliberately separate from this app's own CMS
  // data above. See prisma/kyc/schema.prisma and lib/kyc/prisma.ts.
  KYC_DATABASE_URL: z.string().min(1, "KYC_DATABASE_URL is required"),

  // Own S3-compatible bucket for uploaded KYC documents — private,
  // compliance-gated, distinct from the public marketing S3_* above.
  KYC_S3_ENDPOINT: z.string().optional(),
  KYC_S3_REGION: z.string().default("us-east-1"),
  KYC_S3_BUCKET: z.string().min(1, "KYC_S3_BUCKET is required"),
  KYC_S3_ACCESS_KEY_ID: z.string().min(1, "KYC_S3_ACCESS_KEY_ID is required"),
  KYC_S3_SECRET_ACCESS_KEY: z.string().min(1, "KYC_S3_SECRET_ACCESS_KEY is required"),
  KYC_S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  // Public origin of this admin app itself (e.g.
  // https://regimentadmin-production.up.railway.app) — used to deep-link
  // the notification email straight to a submission's review page.
  ADMIN_APP_ORIGIN: z.string().url().optional(),

  // HubSpot private-app token for the contact-card sync (see
  // lib/kyc/hubspotContactService.ts). Only needs the
  // crm.objects.contacts.read + crm.objects.contacts.write scopes.
  // Unset = sync skipped loudly, submissions unaffected.
  HUBSPOT_ACCESS_TOKEN: z.string().optional(),
  // Numeric portal ID — only used to build the "View in HubSpot" link
  // to a synced contact card on the admin KYC detail page.
  HUBSPOT_PORTAL_ID: z.string().optional(),

  // Cloudflare Turnstile secret for verifying the Review & Submit
  // security-check token server-side (see lib/kyc/turnstile.ts).
  // Unset = verification skipped loudly.
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Comma-separated Microsoft account emails allowed to use the KYC
  // Compliance Review (Verify/Reject) — e.g. Rob's. Unset = every
  // signed-in admin can review (see lib/compliance.ts).
  COMPLIANCE_REVIEWER_EMAILS: z.string().optional(),

  // Admin notification email on every KYC submission. We POST a JSON
  // payload to a Zapier "Catch Hook" webhook; the Zap sends the actual
  // email via a connected real mailbox (e.g. Gmail/Outlook), so no
  // sending-domain/DNS setup is needed on our end.
  ZAPIER_KYC_NOTIFICATION_WEBHOOK_URL: z.string().optional(),
  // Separate Zap for investor rejection emails, so its recipient,
  // sending mailbox, and template are configured independently of the
  // admin notification Zap above. Unset = rejection emails skip loudly
  // (the review UI tells the reviewer the email didn't go out).
  ZAPIER_KYC_REJECTION_WEBHOOK_URL: z.string().optional(),
  ADMIN_NOTIFICATION_EMAILS: z.string().optional(),
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

// Validated lazily on first property access, NOT at import time. During
// `next build` (in Docker, where no runtime env vars exist yet) Next
// imports every route module to collect page data — eager validation
// here would kill the build. At runtime the first access still fails
// fast with the same error if configuration is genuinely missing.
let cached: Env | null = null;

export const env: Env = new Proxy({} as Env, {
  get(_target, prop) {
    cached ??= loadEnv();
    return cached[prop as keyof Env];
  },
});
