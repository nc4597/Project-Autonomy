// Small in-memory sliding-window rate limiter for the public KYC
// endpoints that carry sensitive data (SSN last-4, DOB). In-memory is
// deliberate: the admin service runs as a single Railway instance, and
// this is abuse hygiene, not billing-grade accounting — if the process
// restarts, windows reset, which is fine.

const buckets = new Map<string, number[]>();

// Safety valve so a scripted scan across many spoofed keys can't grow
// the map unboundedly; flushing loses in-flight windows, which only
// ever errs in the caller's favor.
const MAX_TRACKED_KEYS = 10_000;

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => t > now - windowMs);

  if (recent.length >= limit) {
    buckets.set(key, recent);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)),
    };
  }

  if (!buckets.has(key) && buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
  recent.push(now);
  buckets.set(key, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best client identity available behind Railway's proxy. */
export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
