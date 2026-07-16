import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  FRONTEND_ORIGIN: z.string().url(),

  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_BUCKET: z.string().min(1, "S3_BUCKET is required"),
  S3_ACCESS_KEY_ID: z.string().min(1, "S3_ACCESS_KEY_ID is required"),
  S3_SECRET_ACCESS_KEY: z.string().min(1, "S3_SECRET_ACCESS_KEY is required"),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  // Intentionally optional: absence puts HubSpot sync into NOT_CONFIGURED
  // rather than failing startup. See services/hubspotService.ts and
  // services/hubspotFormService.ts.
  HUBSPOT_ACCESS_TOKEN: z.string().optional(),
  HUBSPOT_PORTAL_ID: z.string().optional(),
  // GUID of the target HubSpot Form (Marketing > Forms > this form's
  // "Embed code" or URL contains it). Required for the native-form
  // submission path in services/hubspotFormService.ts.
  HUBSPOT_FORM_GUID: z.string().optional(),

  INTERNAL_SWEEP_SECRET: z.string().optional(),

  // Shared secret required (via the x-admin-secret header) to call the
  // read-only /api/admin/* routes below. Those routes are how apps/admin
  // (the internal CMS, on its own separate database) displays KYC
  // submissions for compliance review — apps/admin never touches this
  // service's Postgres database directly, it calls these endpoints
  // server-side. Not the same secret as INTERNAL_SWEEP_SECRET so the two
  // can be rotated independently.
  ADMIN_API_SECRET: z.string().optional(),

  // Admin notification email (stubbed until configured, same pattern as
  // HubSpot above). See services/adminNotificationService.ts.
  RESEND_API_KEY: z.string().optional(),
  // Comma-separated list, e.g. "compliance@regimentsecurities.com,ops@regimentsecurities.com"
  ADMIN_NOTIFICATION_EMAILS: z.string().optional(),
  // Resend's shared sandbox sender works without verifying a domain —
  // fine for testing, but swap for a verified address on your own domain
  // before sending real notifications.
  EMAIL_FROM_ADDRESS: z.string().default("onboarding@resend.dev"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
