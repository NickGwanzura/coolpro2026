import { fetchAllRefrigerantsRaw, fetchRefrigerantDetailRaw, WhatGasApiError } from './client';
import { validateDetailPayload, validateListPayload } from './validators';
import { mapDetailToRow, mapListItemToRow } from './mapper';
import {
  createSyncLog,
  finishSyncLog,
  getIdsMissingDetail,
  upsertRefrigerantDetail,
  upsertRefrigerants,
} from './repository';

export type SyncType = 'manual' | 'daily-incremental' | 'weekly-full';

export type SyncResult = {
  syncLogId: string;
  status: 'success' | 'partial' | 'failed';
  totalRecords: number;
  createdRecords: number;
  updatedRecords: number;
  failedRecords: number;
  durationMs: number;
  detailsHydrated: number;
  detailsFailed: number;
};

const DETAIL_HYDRATION_CONCURRENCY = 5;

/**
 * Fetches detail-endpoint-only fields (ASHRAE safety group, flammability, toxicity, etc.)
 * for every record that doesn't have them yet — new records from this sync, plus any left
 * over from a previous partial run. Safety-relevant fields (ASHRAE class) must never be left
 * blank waiting for someone to open a detail page, so this runs as part of every sync rather
 * than being purely on-demand. Never throws — per-record failures are logged and skipped;
 * the 30-day on-demand refresh in `service.ts` covers the rest of the freshness story.
 */
async function hydrateMissingDetails(): Promise<{ hydrated: number; failed: number }> {
  const ids = await getIdsMissingDetail();
  if (ids.length === 0) return { hydrated: 0, failed: 0 };

  const queue = [...ids];
  let hydrated = 0;
  let failed = 0;

  async function worker() {
    while (queue.length > 0) {
      const id = queue.shift();
      if (id === undefined) return;
      try {
        const raw = await fetchRefrigerantDetailRaw(id);
        const detail = validateDetailPayload(raw);
        if (detail) {
          await upsertRefrigerantDetail(mapDetailToRow(detail));
          hydrated += 1;
        } else {
          failed += 1;
        }
      } catch {
        failed += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: DETAIL_HYDRATION_CONCURRENCY }, () => worker()));
  return { hydrated, failed };
}

/**
 * Full sync: downloads GetAllODSIdentity (currently WhatGas's only bulk endpoint — there is
 * no delta/incremental API, so "incremental" and "full" sync types both re-download and
 * upsert the complete catalogue; the distinction is preserved for scheduling/reporting).
 * Follows up by hydrating detail-only fields for any record that's missing them.
 *
 * Never throws — a total API failure is recorded as a `failed` sync log and returned, so a
 * scheduled job or admin action can inspect it without crashing the caller.
 */
export async function runWhatGasSync(syncType: SyncType, triggeredBy?: string): Promise<SyncResult> {
  const startedAt = Date.now();
  const log = await createSyncLog({ syncType, triggeredBy });

  try {
    const raw = await fetchAllRefrigerantsRaw();
    const { valid, failures } = validateListPayload(raw);

    const rows = valid.map(mapListItemToRow);
    const { created, updated } = await upsertRefrigerants(rows);

    const { hydrated: detailsHydrated, failed: detailsFailed } = await hydrateMissingDetails();

    const durationMs = Date.now() - startedAt;
    const status = failures.length === 0 ? 'success' : valid.length > 0 ? 'partial' : 'failed';

    await finishSyncLog(log.id, {
      status,
      totalRecords: valid.length + failures.length,
      createdRecords: created,
      updatedRecords: updated,
      failedRecords: failures.length,
      failures: failures.slice(0, 200), // cap stored failure detail to keep the log row small
      durationMs,
    });

    if (failures.length > 0) {
      console.error(`[whatgas/sync] ${failures.length} record(s) failed validation`, failures.slice(0, 10));
    }
    if (detailsFailed > 0) {
      console.error(`[whatgas/sync] ${detailsFailed} record(s) failed detail hydration`);
    }

    return {
      syncLogId: log.id,
      status,
      totalRecords: valid.length + failures.length,
      createdRecords: created,
      updatedRecords: updated,
      failedRecords: failures.length,
      durationMs,
      detailsHydrated,
      detailsFailed,
    };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    const message = err instanceof WhatGasApiError ? err.message : err instanceof Error ? err.message : 'Unknown error';
    console.error('[whatgas/sync] sync failed', message);

    await finishSyncLog(log.id, {
      status: 'failed',
      failures: [{ id: null, error: message }],
      durationMs,
    });

    return {
      syncLogId: log.id,
      status: 'failed',
      totalRecords: 0,
      createdRecords: 0,
      updatedRecords: 0,
      failedRecords: 1,
      durationMs,
      detailsHydrated: 0,
      detailsFailed: 0,
    };
  }
}
