// Figures for the admin Compliance Dashboard. Pure, so the period rules can be tested.

export type CompliancePeriod = 'ytd' | '12m' | 'all';

export const PERIOD_LABEL: Record<CompliancePeriod, string> = {
  ytd: 'Year to date',
  '12m': 'Last 12 months',
  all: 'All time',
};

export interface ReorderLike {
  status: string;
  gasType: string;
  quantityKg: number;
  createdAt: string;
}

/** The first moment of the chosen period, or null for all time. */
export function periodStart(period: CompliancePeriod, now: number): number | null {
  const date = new Date(now);
  if (period === 'ytd') return Date.UTC(date.getUTCFullYear(), 0, 1);
  if (period === '12m') return Date.UTC(date.getUTCFullYear() - 1, date.getUTCMonth(), date.getUTCDate());
  return null;
}

function inPeriod(createdAt: string, period: CompliancePeriod, now: number): boolean {
  const time = new Date(createdAt).getTime();
  if (!Number.isFinite(time)) return false;
  const start = periodStart(period, now);
  return time <= now && (start === null || time >= start);
}

export interface ComplianceKpis {
  approvedKg: number;
  gwpImpactTonnes: number;
  naturalSharePct: number;
  /** Reorders waiting for review right now, whatever the period. */
  pendingReviewCount: number;
}

export function complianceKpis(input: {
  reorders: ReorderLike[];
  period: CompliancePeriod;
  now: number;
  gwpOf: (gasType: string) => number | undefined;
  naturalGases: ReadonlySet<string>;
}): ComplianceKpis {
  const approved = input.reorders.filter((r) => r.status === 'approved' && inPeriod(r.createdAt, input.period, input.now));
  const approvedKg = approved.reduce((sum, r) => sum + r.quantityKg, 0);
  const gwpImpact = approved.reduce((sum, r) => sum + (r.quantityKg * (input.gwpOf(r.gasType) ?? 0)) / 1000, 0);
  const naturalKg = approved.filter((r) => input.naturalGases.has(r.gasType)).reduce((sum, r) => sum + r.quantityKg, 0);
  return {
    approvedKg: Math.round(approvedKg),
    gwpImpactTonnes: Math.round(gwpImpact),
    naturalSharePct: approvedKg > 0 ? Math.round((naturalKg / approvedKg) * 100) : 0,
    pendingReviewCount: input.reorders.filter((r) => r.status === 'pending_hevacraz' || r.status === 'pending_nou').length,
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Approved volume per calendar month for the last `months` months, oldest first. */
export function monthlyApprovedKg(reorders: ReorderLike[], months: number, now: number): Array<{ month: string; kg: number }> {
  const current = new Date(now);
  const buckets: Array<{ key: string; month: string; kg: number }> = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - i, 1));
    buckets.push({ key: `${d.getUTCFullYear()}-${d.getUTCMonth()}`, month: months > 6 ? `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}` : MONTHS[d.getUTCMonth()], kg: 0 });
  }
  for (const reorder of reorders) {
    if (reorder.status !== 'approved') continue;
    const created = new Date(reorder.createdAt);
    if (Number.isNaN(created.getTime())) continue;
    const bucket = buckets.find((b) => b.key === `${created.getUTCFullYear()}-${created.getUTCMonth()}`);
    if (bucket) bucket.kg += reorder.quantityKg;
  }
  return buckets.map(({ month, kg }) => ({ month, kg: Math.round(kg) }));
}

export interface ExpiringCertificate {
  technicianId: string;
  technicianName: string;
  certificate: string;
  expiryDate: string;
  daysLeft: number;
}

/** Certificates expiring within `withinDays` (or already expired), soonest first. */
export function expiringCertificates(
  technicians: Array<{ id: string; name: string; status?: string; certifications: Array<{ name: string; expiryDate?: string | null }> }>,
  now: number,
  withinDays = 90,
  limit = 6,
): ExpiringCertificate[] {
  const DAY = 86_400_000;
  const rows: ExpiringCertificate[] = [];
  for (const technician of technicians) {
    if (technician.status && technician.status !== 'active') continue;
    for (const cert of technician.certifications) {
      const expiry = cert.expiryDate ? new Date(cert.expiryDate).getTime() : Number.NaN;
      if (!Number.isFinite(expiry)) continue;
      const daysLeft = Math.ceil((expiry - now) / DAY);
      if (daysLeft <= withinDays) {
        rows.push({ technicianId: technician.id, technicianName: technician.name, certificate: cert.name, expiryDate: cert.expiryDate as string, daysLeft });
      }
    }
  }
  return rows.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, limit);
}
