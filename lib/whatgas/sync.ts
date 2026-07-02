import { fetchAllRefrigerantsRaw, WhatGasApiError } from './client';
import { validateListPayload } from './validators';
import { mapListItemToRow } from './mapper';
import { createSyncLog, finishSyncLog, upsertRefrigerants } from './repository';

export type SyncType = 'manual' | 'daily-incremental' | 'weekly-full';

export type SyncResult = {
  syncLogId: string;
  status: 'success' | 'partial' | 'failed';
  totalRecords: number;
  createdRecords: number;
  updatedRecords: number;
  failedRecords: number;
  durationMs: number;
};

/**
 * Full sync: downloads GetAllODSIdentity (currently WhatGas's only bulk endpoint — there is
 * no delta/incremental API, so "incremental" and "full" sync types both re-download and
 * upsert the complete catalogue; the distinction is preserved for scheduling/reporting).
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

    return {
      syncLogId: log.id,
      status,
      totalRecords: valid.length + failures.length,
      createdRecords: created,
      updatedRecords: updated,
      failedRecords: failures.length,
      durationMs,
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
    };
  }
}
