const DETAIL_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** True if a previously-fetched detail row is still within the 30-day cache window. */
export function isDetailFresh(detailFetchedAt: Date | null): boolean {
  if (!detailFetchedAt) return false;
  return Date.now() - detailFetchedAt.getTime() < DETAIL_CACHE_TTL_MS;
}
