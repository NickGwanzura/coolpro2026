import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

export type RefrigerantUsageEntry = { refrigerant: string; totalKg: number; count: number };
export type ClassificationBreakdown = { category: string; totalKg: number; count: number };

/** Most-used refrigerants by total kg logged across field gas usage (charge/recovery/leak repair). */
export async function getMostUsedRefrigerants(limit = 10): Promise<RefrigerantUsageEntry[]> {
  const rows = await db.execute<{ refrigerant: string; total_kg: string; count: number }>(sql`
    SELECT refrigerant_type AS refrigerant, COALESCE(SUM(amount), 0) AS total_kg, COUNT(*)::int AS count
    FROM gas_usage_logs
    GROUP BY refrigerant_type
    ORDER BY total_kg DESC
    LIMIT ${limit}
  `);
  return rows.rows.map((r) => ({ refrigerant: r.refrigerant, totalKg: Number(r.total_kg), count: r.count }));
}

/** Most-installed refrigerants across scheduled/completed planner jobs. */
export async function getMostInstalledRefrigerants(limit = 10): Promise<RefrigerantUsageEntry[]> {
  const rows = await db.execute<{ refrigerant: string; total_kg: string; count: number }>(sql`
    SELECT refrigerant_type AS refrigerant, COALESCE(SUM(amount), 0) AS total_kg, COUNT(*)::int AS count
    FROM planner_jobs
    WHERE refrigerant_type IS NOT NULL
    GROUP BY refrigerant_type
    ORDER BY count DESC
    LIMIT ${limit}
  `);
  return rows.rows.map((r) => ({ refrigerant: r.refrigerant, totalKg: Number(r.total_kg), count: r.count }));
}

/** Most-recovered refrigerants (gas usage logs with actionType = 'Recovery'). */
export async function getMostRecoveredRefrigerants(limit = 10): Promise<RefrigerantUsageEntry[]> {
  const rows = await db.execute<{ refrigerant: string; total_kg: string; count: number }>(sql`
    SELECT refrigerant_type AS refrigerant, COALESCE(SUM(amount), 0) AS total_kg, COUNT(*)::int AS count
    FROM gas_usage_logs
    WHERE action_type = 'Recovery'
    GROUP BY refrigerant_type
    ORDER BY total_kg DESC
    LIMIT ${limit}
  `);
  return rows.rows.map((r) => ({ refrigerant: r.refrigerant, totalKg: Number(r.total_kg), count: r.count }));
}

/** Gas usage broken down by WhatGas classification (HFC / HCFC / CFC / high-GWP / ODP / Kigali / Montreal). */
export async function getClassificationBreakdown(): Promise<ClassificationBreakdown[]> {
  const rows = await db.execute<{ category: string; total_kg: string; count: number }>(sql`
    WITH classified AS (
      SELECT g.amount, r.is_hfc, r.is_hcfc, r.is_cfc, r.is_odp,
        (r.gwp ~ '^[0-9.]+$' AND r.gwp::numeric >= 1000) AS high_gwp,
        (r.kigali_gwp_value IS NOT NULL AND r.kigali_gwp_value != '' AND r.kigali_gwp_value != '0') AS kigali_controlled,
        r.is_ctrl_montreal_protocol AS montreal_controlled
      FROM gas_usage_logs g
      LEFT JOIN refrigerants r ON r.id = g.refrigerant_id
    )
    SELECT 'HFC' AS category, COALESCE(SUM(amount) FILTER (WHERE is_hfc), 0) AS total_kg, COUNT(*) FILTER (WHERE is_hfc)::int AS count FROM classified
    UNION ALL
    SELECT 'HCFC', COALESCE(SUM(amount) FILTER (WHERE is_hcfc), 0), COUNT(*) FILTER (WHERE is_hcfc)::int FROM classified
    UNION ALL
    SELECT 'CFC', COALESCE(SUM(amount) FILTER (WHERE is_cfc), 0), COUNT(*) FILTER (WHERE is_cfc)::int FROM classified
    UNION ALL
    SELECT 'ODS (ODP > 0)', COALESCE(SUM(amount) FILTER (WHERE is_odp), 0), COUNT(*) FILTER (WHERE is_odp)::int FROM classified
    UNION ALL
    SELECT 'High GWP (>=1000)', COALESCE(SUM(amount) FILTER (WHERE high_gwp), 0), COUNT(*) FILTER (WHERE high_gwp)::int FROM classified
    UNION ALL
    SELECT 'Kigali Controlled', COALESCE(SUM(amount) FILTER (WHERE kigali_controlled), 0), COUNT(*) FILTER (WHERE kigali_controlled)::int FROM classified
    UNION ALL
    SELECT 'Montreal Controlled', COALESCE(SUM(amount) FILTER (WHERE montreal_controlled), 0), COUNT(*) FILTER (WHERE montreal_controlled)::int FROM classified
  `);
  return rows.rows.map((r) => ({ category: r.category, totalKg: Number(r.total_kg), count: r.count }));
}

/** Monthly usage trend (last 6 months) for trend-line charting. */
export async function getMonthlyUsageTrend(): Promise<{ month: string; totalKg: number }[]> {
  const rows = await db.execute<{ month: string; total_kg: string }>(sql`
    SELECT to_char(date_trunc('month', "timestamp"), 'YYYY-MM') AS month, COALESCE(SUM(amount), 0) AS total_kg
    FROM gas_usage_logs
    WHERE "timestamp" >= now() - interval '6 months'
    GROUP BY 1
    ORDER BY 1
  `);
  return rows.rows.map((r) => ({ month: r.month, totalKg: Number(r.total_kg) }));
}
