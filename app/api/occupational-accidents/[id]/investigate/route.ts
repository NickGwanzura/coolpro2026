import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { occupationalAccidents } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { OccupationalAccident } from '@/types/index';

function toOccupationalAccident(row: typeof occupationalAccidents.$inferSelect): OccupationalAccident {
  return {
    id: row.id,
    technicianId: row.technicianId,
    date: row.date,
    jobSite: row.jobSite,
    clientName: row.clientName,
    severity: row.severity,
    description: row.description,
    technicianName: row.technicianName,
    refrigerantInvolved: row.refrigerantInvolved ?? undefined,
    nearMissFlag: row.nearMissFlag,
    nouNotified: row.nouNotified,
    rootCause: row.rootCause ?? undefined,
    investigationDate: row.investigationDate ?? undefined,
    investigatorName: row.investigatorName ?? undefined,
    correctiveActions: row.correctiveActions ?? undefined,
    preventiveMeasures: row.preventiveMeasures ?? undefined,
    status: row.status,
  };
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Partial<OccupationalAccident>;

  const [row] = await db.select().from(occupationalAccidents).where(eq(occupationalAccidents.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [updated] = await db
    .update(occupationalAccidents)
    .set({
      rootCause: body.rootCause,
      investigationDate: body.investigationDate,
      investigatorName: body.investigatorName,
      correctiveActions: body.correctiveActions,
      preventiveMeasures: body.preventiveMeasures,
      status: body.status as typeof occupationalAccidents.$inferInsert['status'] | undefined,
      updatedAt: new Date(),
    })
    .where(eq(occupationalAccidents.id, id))
    .returning();

  return NextResponse.json(toOccupationalAccident(updated));
}
