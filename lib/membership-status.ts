// How close a registration, membership or certificate is to running out. Pure, for testing.

const DAY_MS = 24 * 60 * 60 * 1000;

export type RenewalState = 'expired' | 'due-soon' | 'ok' | 'unknown';

/** Whole days from now until the date (negative once passed), or null for a missing or bad date. */
export function daysUntil(date: string | null | undefined, now: number): number | null {
  if (!date) return null;
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return null;
  return Math.ceil((time - now) / DAY_MS);
}

export function renewalState(date: string | null | undefined, now: number, warnDays = 60): RenewalState {
  const days = daysUntil(date, now);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  return days <= warnDays ? 'due-soon' : 'ok';
}

export function describeRenewal(date: string | null | undefined, now: number, warnDays = 60): string {
  const days = daysUntil(date, now);
  if (days === null) return 'No expiry date on record';
  if (days < 0) return `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`;
  if (days === 0) return 'Expires today';
  return days <= warnDays ? `Expires in ${days} day${days === 1 ? '' : 's'}` : `Valid until ${date}`;
}

export interface CertificationSummary {
  valid: number;
  expiringSoon: number;
  expired: number;
}

/** A certificate counts as expired once its date has passed, whatever status text was stored. */
export function summariseCertifications(
  certifications: Array<{ expiryDate?: string | null; status?: string }>,
  now: number,
  warnDays = 90,
): CertificationSummary {
  const summary: CertificationSummary = { valid: 0, expiringSoon: 0, expired: 0 };
  for (const cert of certifications) {
    const state = renewalState(cert.expiryDate, now, warnDays);
    if (state === 'expired' || cert.status === 'expired') summary.expired += 1;
    else if (state === 'due-soon') summary.expiringSoon += 1;
    else summary.valid += 1;
  }
  return summary;
}

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  href: string;
}

/** The first steps for a new technician or contractor, ticked off from what they have already done. */
export function gettingStartedChecklist(input: {
  jobs: number;
  gasLogs: number;
  cocRequests: number;
  hasMembership: boolean;
  isContractor: boolean;
}): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { key: 'job', label: 'Plan your first job', done: input.jobs > 0, href: '/field-operations?tab=planner' },
    { key: 'log', label: 'Log refrigerant use on a job', done: input.gasLogs > 0, href: '/field-toolkit' },
    { key: 'coc', label: 'Request a Certificate of Compliance', done: input.cocRequests > 0, href: '/jobs/request-coc' },
  ];
  if (!input.isContractor) {
    items.push({ key: 'membership', label: 'Check your membership and registration dates', done: input.hasMembership, href: '/dashboard' });
  }
  return items;
}
