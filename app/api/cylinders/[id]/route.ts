import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { cylinders } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { Cylinder } from '@/types/index';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['technician', 'vendor', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [existing] = await db.select().from(cylinders).where(eq(cylinders.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (session.role !== 'org_admin' && existing.ownerId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({})) as Partial<Cylinder>;

  const [updated] = await db
    .update(cylinders)
    .set({
      status: body.status ?? existing.status,
      currentFillKg: body.currentFillKg != null ? body.currentFillKg.toString() : existing.currentFillKg,
      lastFilledDate: body.lastFilledDate ?? existing.lastFilledDate,
      lastInspectionDate: body.lastInspectionDate ?? existing.lastInspectionDate,
      nextInspectionDue: body.nextInspectionDue ?? existing.nextInspectionDue,
      notes: body.notes ?? existing.notes,
      updatedAt: new Date(),
    })
    .where(eq(cylinders.id, id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    currentFillKg: Number(updated.currentFillKg),
    updatedAt: updated.updatedAt.toISOString(),
  });
}
