import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { recyclingRecords } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { RecyclingRecord, RecyclingStatus } from '@/types/index';

function toRecyclingRecord(row: typeof recyclingRecords.$inferSelect): RecyclingRecord {
  return {
    id: row.id,
    equipmentId: row.equipmentId ?? undefined,
    refrigerantId: row.refrigerantId ?? undefined,
    refrigerantLabel: row.refrigerantLabel,
    quantityKg: Number(row.quantityKg),
    method: row.method,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    jobSite: row.jobSite,
    recycledDate: row.recycledDate,
    status: row.status as RecyclingRecord['status'],
    notes: row.notes ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Partial<RecyclingRecord>;

  const [existing] = await db
    .select()
    .from(recyclingRecords)
    .where(eq(recyclingRecords.id, id));

  if (!existing) {
    return NextResponse.json({ error: 'Recycling record not found' }, { status: 404 });
  }

  if (body.status && body.status !== existing.status) {
    const validTransitions: Record<string, RecyclingStatus[]> = {
      pending: ['verified', 'rejected'],
      verified: [],
      rejected: [],
    };
    const nextStatus = body.status as RecyclingStatus;
    const allowed = validTransitions[existing.status];
    if (!allowed || !allowed.includes(nextStatus)) {
      return NextResponse.json(
        { error: `Cannot transition from "${existing.status}" to "${nextStatus}"` },
        { status: 400 },
      );
    }
  }

  const updateFields: Record<string, unknown> = {};
  if (body.status) updateFields.status = body.status;
  if (body.notes !== undefined) updateFields.notes = body.notes;

  const [updated] = await db
    .update(recyclingRecords)
    .set(updateFields)
    .where(eq(recyclingRecords.id, id))
    .returning();

  return NextResponse.json(toRecyclingRecord(updated));
}
