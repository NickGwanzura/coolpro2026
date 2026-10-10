// Emissions avoided by recovering refrigerant instead of venting it. Pure, for testing.

export interface RecoveryRow {
  refrigerant: string;
  kg: number;
  /** Global warming potential stored with the log entry, when there was one. */
  gwp: number | null;
}

/**
 * Tonnes of CO2 equivalent kept out of the atmosphere: kilograms recovered times the gas's global
 * warming potential, divided by 1000. A gas with no known potential adds nothing rather than a guess.
 */
export function emissionsAvoidedTonnes(rows: RecoveryRow[], lookupGwp: (refrigerant: string) => number | undefined): number {
  const kgCo2e = rows.reduce((sum, row) => {
    const gwp = row.gwp !== null && Number.isFinite(row.gwp) && row.gwp > 0 ? row.gwp : lookupGwp(row.refrigerant) ?? 0;
    return sum + (Number.isFinite(row.kg) ? row.kg * gwp : 0);
  }, 0);
  return Math.round(kgCo2e / 100) / 10; // tonnes, one decimal place
}

export function totalKg(rows: RecoveryRow[]): number {
  return Math.round(rows.reduce((sum, row) => sum + (Number.isFinite(row.kg) ? row.kg : 0), 0) * 10) / 10;
}
