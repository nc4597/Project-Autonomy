import { env } from "./env";

export const SESSION_COOKIE = "regiment_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Uses Web Crypto (globalThis.crypto.subtle) rather than node:crypto —
// this module is imported from middleware.ts, which runs in the Edge
// runtime and doesn't have Node's crypto module available, only the
// standard Web Crypto API.
async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.ADMIN_SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time comparison so verifying a forged signature doesn't leak
// how many leading characters were correct via response timing.
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Single shared password for now (see the ADMIN_PASSWORD env var), so
// there's no per-user identity to encode — the token is just an
// expiry timestamp plus an HMAC proving it was issued by this server,
// not a real user session. Good enough to gate an internal tool;
// swap for real per-user accounts before this needs an audit trail.
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${expiresAt}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = await sign(payload);
  if (!timingSafeEqualHex(signature, expected)) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && Date.now() < expiresAt;
}
