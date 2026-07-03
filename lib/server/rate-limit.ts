/**
 * In-memory, per-process rate limiter. Deliberately simple — this only holds correctly on a
 * single running instance (fine for the current one-instance Railway deploy). If this service
 * is ever scaled to multiple instances, replace with a shared store (Redis, or a DB table)
 * since each instance would otherwise track its own independent counters.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

// Opportunistic cleanup so the map doesn't grow unbounded under sustained traffic.
const CLEANUP_THRESHOLD = 5000;

function cleanupExpired(now: number) {
  if (buckets.size < CLEANUP_THRESHOLD) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  cleanupExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
