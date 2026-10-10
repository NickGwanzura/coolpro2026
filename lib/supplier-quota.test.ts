import { describe, expect, it } from 'vitest';
import { parseQuota, quotaUsage } from './supplier-quota';

const NOW = Date.parse('2026-10-10T10:00:00Z');
const sale = (quantityKg: number, transactionDate: string) => ({ quantityKg, transactionDate });

describe('quotaUsage', () => {
  it('counts only this calendar year against the annual quota', () => {
    const result = quotaUsage({
      sales: [sale(500, '2026-03-01'), sale(700, '2026-09-30'), sale(9000, '2025-12-31'), sale(100, '2027-01-01')],
      quotaKg: 2000,
      now: NOW,
    });
    expect(result).toMatchObject({ salesKg: 1200, quotaKg: 2000, usagePercent: 60, status: 'within-quota' });
  });

  it('flags near-limit at 85% and exceeded at 100%', () => {
    expect(quotaUsage({ sales: [sale(850, '2026-05-01')], quotaKg: 1000, now: NOW }).status).toBe('near-limit');
    expect(quotaUsage({ sales: [sale(849, '2026-05-01')], quotaKg: 1000, now: NOW }).status).toBe('within-quota');
    expect(quotaUsage({ sales: [sale(1000, '2026-05-01')], quotaKg: 1000, now: NOW }).status).toBe('exceeded');
    expect(quotaUsage({ sales: [sale(1500, '2026-05-01')], quotaKg: 1000, now: NOW }).usagePercent).toBe(150);
  });

  it('never invents a quota: no quota means no status judgement', () => {
    for (const quotaKg of [null, undefined, 0, -5, Number.NaN]) {
      const result = quotaUsage({ sales: [sale(99999, '2026-05-01')], quotaKg, now: NOW });
      expect(result).toMatchObject({ status: 'no-quota', quotaKg: null, usagePercent: null, salesKg: 99999 });
    }
  });

  it('ignores bad quantities and dates', () => {
    const result = quotaUsage({ sales: [sale(Number.NaN, '2026-05-01'), sale(10, 'not a date')], quotaKg: 100, now: NOW });
    expect(result.salesKg).toBe(0);
  });
});

describe('parseQuota', () => {
  it('accepts a positive number, a numeric string, or blank to clear', () => {
    expect(parseQuota(2500)).toEqual({ ok: true, value: 2500 });
    expect(parseQuota('1200.5')).toEqual({ ok: true, value: 1200.5 });
    expect(parseQuota(null)).toEqual({ ok: true, value: null });
    expect(parseQuota('')).toEqual({ ok: true, value: null });
  });

  it('rejects zero, negatives, junk and absurd values', () => {
    for (const bad of [0, -1, 'abc', Number.NaN, 10_000_001, {}, undefined]) {
      expect(parseQuota(bad).ok).toBe(false);
    }
  });
});
