import { fetchRefrigerantDetailRaw, WhatGasApiError } from './client';
import { validateDetailPayload } from './validators';
import { mapDetailToRow } from './mapper';
import { getRefrigerantById, upsertRefrigerantDetail, searchRefrigerants, type RefrigerantFilters } from './repository';
import { isDetailFresh } from './cache';
import { classifySafetyAlert } from '@/lib/refrigerantIntelligence';
import type { WhatGasRefrigerantProfile } from '@/types/index';

export { searchRefrigerants, type RefrigerantFilters } from './repository';

/**
 * Returns a refrigerant's full detail, refreshing from WhatGas if the cached detail is
 * missing or older than 30 days. Falls back to whatever is already in the DB (even if
 * stale) if the live refresh fails — a WhatGas outage should never break this page.
 */
export async function getRefrigerantDetail(id: number) {
  const existing = await getRefrigerantById(id);

  if (existing && isDetailFresh(existing.detailFetchedAt)) {
    return existing;
  }

  try {
    const raw = await fetchRefrigerantDetailRaw(id);
    const detail = validateDetailPayload(raw);
    if (!detail) {
      console.error(`[whatgas/service] detail validation failed for id=${id}`);
      return existing;
    }
    const row = mapDetailToRow(detail);
    await upsertRefrigerantDetail(row);
    return await getRefrigerantById(id);
  } catch (err) {
    const message = err instanceof WhatGasApiError ? err.message : String(err);
    console.error(`[whatgas/service] live detail refresh failed for id=${id}: ${message}`);
    return existing; // graceful fallback to stale cache (or null if never synced)
  }
}

export async function listRefrigerantsForSelect(query: string, limit = 20) {
  const { rows } = await searchRefrigerants({ q: query } as RefrigerantFilters, 1, limit);
  return rows;
}

/** Server-side equivalent of the client-only fetchWhatGasProfile — used by API routes that
 * need a WhatGasRefrigerantProfile from a known refrigerant id (no HTTP round-trip to self). */
export async function getWhatGasProfileById(id: number): Promise<WhatGasRefrigerantProfile | null> {
  const record = await getRefrigerantDetail(id);
  if (!record) return null;

  const code = record.ashraeCode ?? record.odsName ?? String(record.id);
  const ashraeSafetyClass = record.ashraeSafetyGroup ?? 'Unclassified';
  const classification = classifySafetyAlert(ashraeSafetyClass);

  return {
    id: record.id,
    code,
    commonName: record.odsName ?? code,
    ashraeSafetyClass,
    riskColor: classification.color,
    riskLevel: classification.riskLevel,
    typicalUse: (record.realApplications as string[] | null)?.[0] ?? 'See the WhatGas record for application detail.',
    odp: Number(record.odp) || 0,
    gwp: Number(record.gwp) || 0,
    emergencyNotes: [],
    fieldChecklist: [],
    whatGasReference: `UNEP WhatGas registry record #${record.id}`,
  };
}
