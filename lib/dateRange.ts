export type SimpleDateRange = 'today' | 'week' | 'month';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Millisecond width of a 'today' | 'week' | 'month' selector — single source of truth. */
export function rangeMsFor(range: SimpleDateRange): number {
  if (range === 'today') return DAY_MS;
  if (range === 'week') return 7 * DAY_MS;
  return 30 * DAY_MS;
}
