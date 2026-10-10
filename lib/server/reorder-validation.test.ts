import { describe, expect, it } from 'vitest';
import { MAX_REORDER_KG, validateReorder } from './reorder-validation';

const valid = { gasType: 'R-290', quantityKg: 250, purpose: 'Restock for cold rooms', supplierNotes: '' };

describe('validateReorder', () => {
  it('accepts a normal reorder and defaults to a purchase', () => {
    expect(validateReorder(valid)).toEqual({ ok: true, value: { ...valid, reorderType: 'purchase' } });
  });

  it('accepts a recovery return and numeric strings, rounding to grams', () => {
    const result = validateReorder({ ...valid, quantityKg: '12.34567', reorderType: 'recovery' });
    expect(result).toMatchObject({ ok: true, value: { reorderType: 'recovery', quantityKg: 12.346 } });
  });

  it.each([0, -5, 'abc', '', null, undefined, Number.NaN, Infinity])('rejects quantity %s', (quantityKg) => {
    expect(validateReorder({ ...valid, quantityKg }).ok).toBe(false);
  });

  it('rejects an absurd quantity', () => {
    expect(validateReorder({ ...valid, quantityKg: MAX_REORDER_KG + 1 }).ok).toBe(false);
    expect(validateReorder({ ...valid, quantityKg: MAX_REORDER_KG }).ok).toBe(true);
  });

  it('requires a refrigerant and a purpose, and caps text', () => {
    expect(validateReorder({ ...valid, gasType: ' ' }).ok).toBe(false);
    expect(validateReorder({ ...valid, purpose: '' }).ok).toBe(false);
    expect(validateReorder({ ...valid, purpose: 'x'.repeat(501) }).ok).toBe(false);
    expect(validateReorder({ ...valid, supplierNotes: 'x'.repeat(2001) }).ok).toBe(false);
  });

  it('rejects an unknown reorder type and junk bodies', () => {
    expect(validateReorder({ ...valid, reorderType: 'gift' }).ok).toBe(false);
    expect(validateReorder(null).ok).toBe(false);
  });
});
