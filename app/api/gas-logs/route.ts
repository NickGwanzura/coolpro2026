import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { gasUsageLogs } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { RefrigerantLog } from '@/types/index';

function toRefrigerantLog(row: typeof gasUsageLogs.$inferSelect): RefrigerantLog {
  return {
    id: row.id,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    clientName: row.clientName,
    location: row.location,
    plannerJobId: row.plannerJobId ?? undefined,
    jobType: row.jobType as RefrigerantLog['jobType'],
    refrigerantId: row.refrigerantId ?? undefined,
    refrigerantType: row.refrigerantType,
    refrigerantClass: (row.refrigerantClass ?? undefined) as RefrigerantLog['refrigerantClass'],
    amount: Number(row.amount),
    actionType: row.actionType as RefrigerantLog['actionType'],
    timestamp: row.timestamp.toISOString(),
    approvedSupplierId: row.approvedSupplierId ?? undefined,
    approvedSupplierName: row.approvedSupplierName ?? undefined,
    supplierVerified: row.supplierVerified ?? undefined,
    pesepayTransactionId: row.pesepayTransactionId ?? undefined,
    odp: row.odp ? Number(row.odp) : undefined,
    gwp: row.gwp ? Number(row.gwp) : undefined,
    co2EqEmissions: row.co2EqEmissions ? Number(row.co2EqEmissions) : undefined,
    ashraeSafetyClass: (row.ashraeSafetyClass ?? undefined) as RefrigerantLog['ashraeSafetyClass'],
    supplierId: row.supplierId ?? undefined,
    purchaseTransactionId: row.purchaseTransactionId ?? undefined,
  };
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician', 'trainer', 'lecturer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  let logs: RefrigerantLog[];
  try {
    const body = await req.json();
    logs = body.logs as RefrigerantLog[];
    if (!Array.isArray(logs)) {
      return NextResponse.json({ error: 'Expected an array of logs under the "logs" key' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Technicians can only ever log gas usage under their own identity — the client-supplied
  // technicianId/technicianName is ignored for that role to prevent misattribution. Reviewer
  // roles (trainer/lecturer/org_admin) are trusted to log on a technician's behalf.

  // Validate FK integrity: refrigerantType requires a refrigerantId to prevent orphaned text refs
  for (const log of logs) {
    if (log.refrigerantType && !log.refrigerantId) {
      return NextResponse.json({
        error: `refrigerantId is required when refrigerantType is provided (log for "${log.clientName}")`,
      }, { status: 400 });
    }
  }

  const inserted = await db
    .insert(gasUsageLogs)
    .values(
      logs.map((log) => ({
        technicianId: session.role === 'technician' ? session.id : log.technicianId,
        technicianName: session.role === 'technician' ? session.name : log.technicianName,
        clientName: log.clientName,
        location: log.location ?? '',
        plannerJobId: log.plannerJobId ?? null,
        jobType: log.jobType,
        refrigerantId: log.refrigerantId ?? null,
        refrigerantType: log.refrigerantType,
        refrigerantClass: log.refrigerantClass ?? null,
        amount: log.amount.toString(),
        actionType: log.actionType,
        timestamp: new Date(log.timestamp),
        approvedSupplierId: log.approvedSupplierId ?? null,
        approvedSupplierName: log.approvedSupplierName ?? null,
        supplierVerified: log.supplierVerified ?? null,
        pesepayTransactionId: log.pesepayTransactionId ?? null,
        odp: log.odp ? log.odp.toString() : null,
        gwp: log.gwp ? log.gwp.toString() : null,
        co2EqEmissions: log.co2EqEmissions ? log.co2EqEmissions.toString() : null,
        ashraeSafetyClass: log.ashraeSafetyClass ?? null,
        supplierId: log.supplierId ?? null,
        purchaseTransactionId: log.purchaseTransactionId ?? null,
      }))
    )
    .returning();

  return NextResponse.json(inserted.map(toRefrigerantLog), { status: 201 });
}

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
  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 500);

  let query = db.select().from(gasUsageLogs).$dynamic();

  // Filter by technician if role is technician (only see their own logs)
  if (session.role === 'technician') {
    query = query.where(
      sql`${gasUsageLogs.technicianId} = ${session.id}::uuid`
    );
  }

  if (from) {
    query = query.where(sql`${gasUsageLogs.timestamp} >= ${new Date(from)}::timestamptz`);
  }
  if (to) {
    query = query.where(sql`${gasUsageLogs.timestamp} <= ${new Date(to)}::timestamptz`);
  }

  const rows = await query
    .orderBy(sql`${gasUsageLogs.timestamp} DESC`)
    .limit(limit);

  return NextResponse.json(rows.map(toRefrigerantLog));
}
