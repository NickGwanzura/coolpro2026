// Supplier import quotas. The quota is an annual figure set by an administrator, so only sales in
// the current calendar year count against it. Pure, so the rules can be tested.

export type QuotaStatus = 'no-quota' | 'within-quota' | 'near-limit' | 'exceeded';

export const NEAR_LIMIT_PERCENT = 85;
export const MAX_QUOTA_KG = 10_000_000;

export interface QuotaUsage {
  /** Kilograms sold so far this calendar year. */
  salesKg: number;
  quotaKg: number | null;
  usagePercent: number | null;
  status: QuotaStatus;
}

export function quotaUsage(input: {
  sales: Array<{ quantityKg: number; transactionDate: string }>;
  quotaKg: number | null | undefined;
  now: number;
}): QuotaUsage {
  const year = new Date(input.now).getUTCFullYear();
  const salesKg = input.sales
    .filter((sale) => new Date(sale.transactionDate).getUTCFullYear() === year)
    .reduce((sum, sale) => sum + (Number.isFinite(sale.quantityKg) ? sale.quantityKg : 0), 0);

  const quotaKg = typeof input.quotaKg === 'number' && Number.isFinite(input.quotaKg) && input.quotaKg > 0 ? input.quotaKg : null;
  if (quotaKg === null) return { salesKg, quotaKg: null, usagePercent: null, status: 'no-quota' };

  const usagePercent = (salesKg / quotaKg) * 100;
  const status: QuotaStatus = usagePercent >= 100 ? 'exceeded' : usagePercent >= NEAR_LIMIT_PERCENT ? 'near-limit' : 'within-quota';
  return { salesKg, quotaKg, usagePercent, status };
}

/** A quota an administrator enters: a positive number of kg, or null to clear it. */
export function parseQuota(value: unknown): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value === null || value === '') return { ok: true, value: null };
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Enter a quota greater than zero, or leave it blank to clear it.' };
  if (n > MAX_QUOTA_KG) return { ok: false, error: `A quota cannot exceed ${MAX_QUOTA_KG.toLocaleString()} kg.` };
  return { ok: true, value: Math.round(n * 1000) / 1000 };
}
