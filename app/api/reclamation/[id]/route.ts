import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { reclamationRecords } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { ReclamationRecord, ReclamationStatus } from '@/types/index';

function toReclamationRecord(row: typeof reclamationRecords.$inferSelect): ReclamationRecord {
  return {
    id: row.id,
    batchNumber: row.batchNumber,
    refrigerantId: row.refrigerantId ?? undefined,
    refrigerantLabel: row.refrigerantLabel,
    sourceDescription: row.sourceDescription,
    quantityKg: Number(row.quantityKg),
    purityPercent: row.purityPercent ? Number(row.purityPercent) : undefined,
    testMethod: row.testMethod ?? undefined,
    facilityName: row.facilityName,
    technicianId: row.technicianId ?? undefined,
    technicianName: row.technicianName,
    status: row.status as ReclamationRecord['status'],
    testedDate: row.testedDate ?? undefined,
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
    session = requireRole(req, ['org_admin', 'technician']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Partial<ReclamationRecord>;

  // Fetch existing record
  const [existing] = await db
    .select()
    .from(reclamationRecords)
    .where(eq(reclamationRecords.id, id));

  if (!existing) {
    return NextResponse.json({ error: 'Reclamation record not found' }, { status: 404 });
  }

  // Only org_admin can approve/reject (change status from pending to passed/failed)
  if (body.status && body.status !== existing.status) {
    if (session.role !== 'org_admin') {
      return NextResponse.json({ error: 'Only administrators can review reclamation records' }, { status: 403 });
    }

    const validTransitions: Record<string, ReclamationStatus[]> = {
      pending: ['passed', 'failed'],
      passed: [],
      failed: [],
    };

    const nextStatus = body.status as ReclamationStatus;
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
  if (body.purityPercent !== undefined) updateFields.purityPercent = body.purityPercent.toString();
  if (body.testMethod !== undefined) updateFields.testMethod = body.testMethod;
  if (body.testedDate !== undefined) updateFields.testedDate = body.testedDate;
  if (body.notes !== undefined) updateFields.notes = body.notes;

  const [updated] = await db
    .update(reclamationRecords)
    .set(updateFields)
    .where(eq(reclamationRecords.id, id))
    .returning();

  return NextResponse.json(toReclamationRecord(updated));
}
