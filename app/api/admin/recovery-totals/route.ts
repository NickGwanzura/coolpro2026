import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { gasUsageLogs } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { REFRIGERANT_REFERENCE } from '@/constants/refrigerants';
import { emissionsAvoidedTonnes, totalKg, type RecoveryRow } from '@/lib/recovery-emissions';

/** Refrigerant technicians have recovered in the field (all time), worked out from their logs. */
export async function GET(req: Request) {
  try {
    await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows = await db
    .select({
      refrigerant: gasUsageLogs.refrigerantType,
      kg: sql<string>`coalesce(sum(${gasUsageLogs.amount}), 0)`,
      gwp: sql<string | null>`max(${gasUsageLogs.gwp})`,
    })
    .from(gasUsageLogs)
    .where(eq(gasUsageLogs.actionType, 'Recovery'))
    .groupBy(gasUsageLogs.refrigerantType);

  const recovery: RecoveryRow[] = rows.map((row) => ({
    refrigerant: row.refrigerant,
    kg: Number(row.kg),
    gwp: row.gwp === null ? null : Number(row.gwp),
  }));

  return NextResponse.json({
    fieldRecoveredKg: totalKg(recovery),
    fieldEmissionsAvoidedTonnes: emissionsAvoidedTonnes(recovery, (name) => REFRIGERANT_REFERENCE[name]?.gwp),
  });
}
