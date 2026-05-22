import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { gasUsageLogs } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { JobType, JobTypeLabels, GasUsageByJobTypeEntry, GasUsageByJobTypeResponse } from '@/types/index';

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician', 'trainer', 'lecturer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  // Build query
  let query = db.select().from(gasUsageLogs).$dynamic();

  // Technicians only see their own logs
  if (session.role === 'technician') {
    query = query.where(sql`${gasUsageLogs.technicianId} = ${session.id}::uuid`);
  }

  if (from) {
    query = query.where(sql`${gasUsageLogs.timestamp} >= ${new Date(from)}::timestamptz`);
  }
  if (to) {
    query = query.where(sql`${gasUsageLogs.timestamp} <= ${new Date(to)}::timestamptz`);
  }

  const rows = await query;

  // Aggregate by job type
  const byJobType = new Map<JobType, {
    totalKg: number;
    chargeKg: number;
    recoveryKg: number;
    leakRepairKg: number;
    count: number;
    refrigerants: Set<string>;
  }>();

  for (const log of rows) {
    const jt = log.jobType as JobType;
    if (!byJobType.has(jt)) {
      byJobType.set(jt, {
        totalKg: 0,
        chargeKg: 0,
        recoveryKg: 0,
        leakRepairKg: 0,
        count: 0,
        refrigerants: new Set(),
      });
    }
    const entry = byJobType.get(jt)!;
    const amount = Number(log.amount);
    entry.totalKg += amount;
    entry.count += 1;
    entry.refrigerants.add(log.refrigerantType);
    if (log.actionType === 'Charge') entry.chargeKg += amount;
    else if (log.actionType === 'Recovery') entry.recoveryKg += amount;
    else if (log.actionType === 'Leak Repair') entry.leakRepairKg += amount;
  }

  const entries: GasUsageByJobTypeEntry[] = Array.from(byJobType.entries())
    .sort(([a], [b]) => JobTypeLabels[a].localeCompare(JobTypeLabels[b]))
    .map(([jobType, data]) => ({
      jobType,
      label: JobTypeLabels[jobType] ?? jobType,
      totalKg: Math.round(data.totalKg * 100) / 100,
      chargeKg: Math.round(data.chargeKg * 100) / 100,
      recoveryKg: Math.round(data.recoveryKg * 100) / 100,
      leakRepairKg: Math.round(data.leakRepairKg * 100) / 100,
      count: data.count,
      refrigerants: Array.from(data.refrigerants).sort(),
    }));

  const totalKg = Math.round(entries.reduce((sum, e) => sum + e.totalKg, 0) * 100) / 100;
  const totalEntries = rows.length;

  const response: GasUsageByJobTypeResponse = { entries, totalKg, totalEntries };

  return NextResponse.json(response);
}
