import { describe, expect, it } from 'vitest';
import { emissionsAvoidedTonnes, totalKg } from './recovery-emissions';

const lookup = (name: string) => ({ 'R-410A': 2088, 'R-134a': 1430 } as Record<string, number>)[name];

describe('emissionsAvoidedTonnes', () => {
  it('multiplies kilograms by the warming potential and converts to tonnes', () => {
    expect(emissionsAvoidedTonnes([{ refrigerant: 'R-410A', kg: 10, gwp: 2088 }], lookup)).toBe(20.9);
  });

  it('uses the reference table when the log has no stored potential', () => {
    expect(emissionsAvoidedTonnes([{ refrigerant: 'R-134a', kg: 100, gwp: null }], lookup)).toBe(143);
  });

  it('adds nothing for a gas it knows nothing about', () => {
    expect(emissionsAvoidedTonnes([{ refrigerant: 'Mystery', kg: 500, gwp: null }], lookup)).toBe(0);
  });

  it('adds across gases and ignores bad quantities', () => {
    const rows = [
      { refrigerant: 'R-410A', kg: 10, gwp: null },
      { refrigerant: 'R-134a', kg: 10, gwp: null },
      { refrigerant: 'R-134a', kg: Number.NaN, gwp: null },
    ];
    expect(emissionsAvoidedTonnes(rows, lookup)).toBe(35.2);
  });

  it('is zero with nothing recovered', () => {
    expect(emissionsAvoidedTonnes([], lookup)).toBe(0);
  });
});

describe('totalKg', () => {
  it('sums and rounds to one decimal', () => {
    expect(totalKg([{ refrigerant: 'a', kg: 1.26, gwp: null }, { refrigerant: 'b', kg: 2.1, gwp: null }])).toBe(3.4);
    expect(totalKg([])).toBe(0);
  });
});
