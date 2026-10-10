import { isIP } from 'node:net';

/**
 * In-memory, per-process rate limiter. Deliberately simple — this only holds correctly on a
 * single running instance (fine for the current one-instance deploy). If this service
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

/**
 * The visitor's address, for rate limiting. Behind the reverse proxy the proxy sets X-Real-IP, or
 * appends the connecting address to the END of X-Forwarded-For. Anything a visitor sends themselves
 * sits earlier in that list, so only the last entry is trusted. If neither header yields a valid
 * address, everyone shares one bucket rather than being able to choose their own.
 */
export function getClientIp(req: Request): string {
  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp && isIP(realIp)) return realIp;

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const last = forwarded.split(',').map((part) => part.trim()).filter(Boolean).at(-1);
    if (last && isIP(last)) return last;
  }
  return 'unknown';
}
