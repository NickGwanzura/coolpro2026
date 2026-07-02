import { pgEnum, pgTable, text, integer, boolean, timestamp, jsonb, uuid, index } from 'drizzle-orm/pg-core';

export const whatgasSyncStatusEnum = pgEnum('whatgas_sync_status', [
  'running',
  'success',
  'partial',
  'failed',
]);

export const whatgasSyncTypeEnum = pgEnum('whatgas_sync_type', [
  'manual',
  'daily-incremental',
  'weekly-full',
]);

// UNEP WhatGas is the source of truth for refrigerant reference data. `id` is the
// upstream WhatGas identity — we intentionally do NOT generate our own primary key so
// that re-syncs always upsert onto the same row (never duplicate).
export const refrigerants = pgTable('refrigerants', {
  id: integer('id').primaryKey(),
  odsName: text('ods_name'),
  ashraeCode: text('ashrae_code'),
  ashraeTypeId: integer('ashrae_type_id'),
  ashraeTypeName: text('ashrae_type_name'),
  chemicalType: text('chemical_type'),
  casCode: text('cas_code'),

  formulaList: jsonb('formula_list').notNull().default([]),
  alternativeFormulaList: jsonb('alternative_formula_list').notNull().default([]),
  chemicalNameList: jsonb('chemical_name_list').notNull().default([]),
  alternativeChemicalNameList: jsonb('alternative_chemical_name_list').notNull().default([]),
  commonTradeNameList: jsonb('common_trade_name_list').notNull().default([]),
  realApplications: jsonb('real_applications').notNull().default([]),
  dangerSymbol: jsonb('danger_symbol').notNull().default([]),
  images: jsonb('images').notNull().default([]),

  gwp: text('gwp'),
  gwpSource: text('gwp_source'),
  gwpNote: text('gwp_note'),
  odp: text('odp'),
  odpSource: text('odp_source'),
  odpNote: text('odp_note'),
  mpValue: text('mp_value'),
  mpSource: text('mp_source'),
  mpNote: text('mp_note'),
  kigaliGwpValue: text('kigali_gwp_value'),
  kigaliGwpSource: text('kigali_gwp_source'),

  ashraeSafetyGroup: text('ashrae_safety_group'),
  flammability: text('flammability'),
  toxicity: text('toxicity'),

  annexGroupId: integer('annex_group_id'),
  annexGroupName: text('annex_group_name'),
  isCtrlMontrealProtocol: boolean('is_ctrl_montreal_protocol'),

  hsCode: text('hs_code'),
  hsCode2017: text('hs_code_2017'),
  hsCode2022: text('hs_code_2022'),
  unCode: text('un_code'),

  isHFC: boolean('is_hfc').notNull().default(false),
  isHCFC: boolean('is_hcfc').notNull().default(false),
  isCFC: boolean('is_cfc').notNull().default(false),
  isODP: boolean('is_odp').notNull().default(false),
  isGWP: boolean('is_gwp').notNull().default(false),
  isSingle: boolean('is_single').notNull().default(false),
  hasIcon: boolean('has_icon').notNull().default(false),

  // Lowercased concatenation of every searchable field (name, codes, formulas, trade
  // names, CAS) so free-text search is a single ILIKE instead of N jsonb containment checks.
  searchText: text('search_text').notNull().default(''),

  detailFetchedAt: timestamp('detail_fetched_at', { withTimezone: true }),
  lastUpdated: timestamp('last_updated', { withTimezone: true }),

  // Full untouched upstream payload — guarantees forward compatibility if WhatGas adds fields.
  raw: jsonb('raw').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  searchTextIdx: index('refrigerants_search_text_idx').on(table.searchText),
  ashraeCodeIdx: index('refrigerants_ashrae_code_idx').on(table.ashraeCode),
}));

export const whatgasSyncLogs = pgTable('whatgas_sync_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  syncType: whatgasSyncTypeEnum('sync_type').notNull(),
  status: whatgasSyncStatusEnum('status').notNull().default('running'),
  totalRecords: integer('total_records').notNull().default(0),
  createdRecords: integer('created_records').notNull().default(0),
  updatedRecords: integer('updated_records').notNull().default(0),
  failedRecords: integer('failed_records').notNull().default(0),
  failures: jsonb('failures').notNull().default([]),
  durationMs: integer('duration_ms'),
  triggeredBy: text('triggered_by'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});
