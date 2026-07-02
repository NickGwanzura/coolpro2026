import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { refrigerants, whatgasSyncLogs } from '@/db/schema/index';

type RefrigerantInsert = typeof refrigerants.$inferInsert;
type RefrigerantRow = typeof refrigerants.$inferSelect;

const UPSERT_BATCH_SIZE = 200;

export type UpsertResult = { created: number; updated: number };

/**
 * Upserts rows keyed by the WhatGas `id` (never our own generated id, so re-syncs always
 * land on the same row and never duplicate). Batched to keep each statement small.
 */
export async function upsertRefrigerants(rows: RefrigerantInsert[]): Promise<UpsertResult> {
  if (rows.length === 0) return { created: 0, updated: 0 };

  const existingIds = new Set(
    (await db.select({ id: refrigerants.id }).from(refrigerants)).map((r) => r.id),
  );

  let created = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(i, i + UPSERT_BATCH_SIZE);
    await db
      .insert(refrigerants)
      .values(batch)
      .onConflictDoUpdate({
        target: refrigerants.id,
        set: {
          odsName: sql`excluded.ods_name`,
          ashraeCode: sql`excluded.ashrae_code`,
          ashraeTypeId: sql`excluded.ashrae_type_id`,
          chemicalType: sql`excluded.chemical_type`,
          casCode: sql`excluded.cas_code`,
          formulaList: sql`excluded.formula_list`,
          alternativeFormulaList: sql`excluded.alternative_formula_list`,
          chemicalNameList: sql`excluded.chemical_name_list`,
          alternativeChemicalNameList: sql`excluded.alternative_chemical_name_list`,
          commonTradeNameList: sql`excluded.common_trade_name_list`,
          realApplications: sql`excluded.real_applications`,
          dangerSymbol: sql`excluded.danger_symbol`,
          gwp: sql`excluded.gwp`,
          gwpSource: sql`excluded.gwp_source`,
          gwpNote: sql`excluded.gwp_note`,
          odp: sql`excluded.odp`,
          odpSource: sql`excluded.odp_source`,
          odpNote: sql`excluded.odp_note`,
          mpValue: sql`excluded.mp_value`,
          mpSource: sql`excluded.mp_source`,
          mpNote: sql`excluded.mp_note`,
          kigaliGwpValue: sql`excluded.kigali_gwp_value`,
          kigaliGwpSource: sql`excluded.kigali_gwp_source`,
          hsCode: sql`excluded.hs_code`,
          hsCode2017: sql`excluded.hs_code_2017`,
          hsCode2022: sql`excluded.hs_code_2022`,
          unCode: sql`excluded.un_code`,
          isHFC: sql`excluded.is_hfc`,
          isHCFC: sql`excluded.is_hcfc`,
          isCFC: sql`excluded.is_cfc`,
          isODP: sql`excluded.is_odp`,
          isGWP: sql`excluded.is_gwp`,
          isSingle: sql`excluded.is_single`,
          hasIcon: sql`excluded.has_icon`,
          searchText: sql`excluded.search_text`,
          raw: sql`excluded.raw`,
          updatedAt: new Date(),
        },
      });

    for (const row of batch) {
      if (existingIds.has(row.id)) updated += 1;
      else created += 1;
    }
  }

  return { created, updated };
}

export async function upsertRefrigerantDetail(row: RefrigerantInsert): Promise<void> {
  await db
    .insert(refrigerants)
    .values(row)
    .onConflictDoUpdate({
      target: refrigerants.id,
      set: { ...row, updatedAt: new Date() },
    });
}

export async function getRefrigerantById(id: number): Promise<RefrigerantRow | null> {
  const [row] = await db.select().from(refrigerants).where(eq(refrigerants.id, id)).limit(1);
  return row ?? null;
}

export type RefrigerantFilters = {
  q?: string;
  isHFC?: boolean;
  isHCFC?: boolean;
  isCFC?: boolean;
  isSingle?: boolean; // false => blend
  highGwp?: boolean; // GWP-numeric >= 1000
  isODP?: boolean;
  hasKigaliValue?: boolean;
  isCtrlMontrealProtocol?: boolean;
};

const HIGH_GWP_THRESHOLD = 1000;

function buildFilterConditions(filters: RefrigerantFilters) {
  const conditions = [];
  if (filters.q) {
    conditions.push(ilike(refrigerants.searchText, `%${filters.q.toLowerCase()}%`));
  }
  if (filters.isHFC !== undefined) conditions.push(eq(refrigerants.isHFC, filters.isHFC));
  if (filters.isHCFC !== undefined) conditions.push(eq(refrigerants.isHCFC, filters.isHCFC));
  if (filters.isCFC !== undefined) conditions.push(eq(refrigerants.isCFC, filters.isCFC));
  if (filters.isSingle !== undefined) conditions.push(eq(refrigerants.isSingle, filters.isSingle));
  if (filters.isODP !== undefined) conditions.push(eq(refrigerants.isODP, filters.isODP));
  if (filters.isCtrlMontrealProtocol !== undefined) {
    conditions.push(eq(refrigerants.isCtrlMontrealProtocol, filters.isCtrlMontrealProtocol));
  }
  if (filters.hasKigaliValue) {
    conditions.push(sql`${refrigerants.kigaliGwpValue} IS NOT NULL AND ${refrigerants.kigaliGwpValue} != '' AND ${refrigerants.kigaliGwpValue} != '0'`);
  }
  if (filters.highGwp) {
    conditions.push(sql`(${refrigerants.gwp} ~ '^[0-9.]+$' AND ${refrigerants.gwp}::numeric >= ${HIGH_GWP_THRESHOLD})`);
  }
  return conditions;
}

export async function searchRefrigerants(
  filters: RefrigerantFilters,
  page: number,
  pageSize: number,
): Promise<{ rows: RefrigerantRow[]; total: number }> {
  const conditions = buildFilterConditions(filters);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ count }]] = await Promise.all([
    db
      .select()
      .from(refrigerants)
      .where(where)
      .orderBy(asc(refrigerants.odsName))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(refrigerants).where(where),
  ]);

  return { rows, total: count };
}

export async function countRefrigerants(): Promise<number> {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(refrigerants);
  return count;
}

// ---------------------------------------------------------------------------
// Sync logs
// ---------------------------------------------------------------------------

export async function createSyncLog(input: {
  syncType: typeof whatgasSyncLogs.$inferInsert['syncType'];
  triggeredBy?: string;
}) {
  const [row] = await db
    .insert(whatgasSyncLogs)
    .values({ syncType: input.syncType, triggeredBy: input.triggeredBy ?? null, status: 'running' })
    .returning();
  return row;
}

export async function finishSyncLog(
  id: string,
  update: Partial<typeof whatgasSyncLogs.$inferInsert>,
) {
  await db
    .update(whatgasSyncLogs)
    .set({ ...update, finishedAt: new Date() })
    .where(eq(whatgasSyncLogs.id, id));
}

export async function listSyncLogs(limit = 20) {
  return db.select().from(whatgasSyncLogs).orderBy(desc(whatgasSyncLogs.startedAt)).limit(limit);
}

export async function getLastSuccessfulSync() {
  const [row] = await db
    .select()
    .from(whatgasSyncLogs)
    .where(or(eq(whatgasSyncLogs.status, 'success'), eq(whatgasSyncLogs.status, 'partial')))
    .orderBy(desc(whatgasSyncLogs.finishedAt))
    .limit(1);
  return row ?? null;
}
