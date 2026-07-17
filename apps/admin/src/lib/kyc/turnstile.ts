import { env } from "../env";
import { kycLogger } from "./logger";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Server-side half of the Review & Submit security check: verifies the
 * Turnstile token the browser earned in the popup. Tokens are
 * single-use and bound to our site key, so a bot can't skip the popup
 * or replay an old token.
 *
 * Unset TURNSTILE_SECRET_KEY = loud, logged skip (same NOT_CONFIGURED
 * pattern as the other integrations). If Cloudflare's verify endpoint
 * itself is unreachable we fail open with an error log — an investor's
 * submission shouldn't be lost to a third-party outage, and every
 * submission still goes through human compliance review.
 */
export async function verifyCaptchaToken(
  token: unknown,
  remoteIp?: string | null
): Promise<{ ok: boolean; reason?: string }> {
  if (!env.TURNSTILE_SECRET_KEY) {
    kycLogger.warn(
      { reason: "TURNSTILE_SECRET_KEY not set" },
      "captcha verification skipped: integration not configured"
    );
    return { ok: true };
  }

  if (typeof token !== "string" || token.length === 0) {
    return { ok: false, reason: "missing captcha token" };
  }

  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (remoteIp) form.set("remoteip", remoteIp);

  try {
    const response = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    if (!response.ok) {
      kycLogger.error({ status: response.status }, "turnstile siteverify returned non-200, failing open");
      return { ok: true };
    }
    const result = (await response.json()) as { success: boolean; "error-codes"?: string[] };
    return result.success
      ? { ok: true }
      : { ok: false, reason: (result["error-codes"] ?? ["unknown"]).join(",") };
  } catch (err) {
    kycLogger.error(
      { err: err instanceof Error ? err.message : String(err) },
      "turnstile siteverify unreachable, failing open"
    );
    return { ok: true };
  }
}
