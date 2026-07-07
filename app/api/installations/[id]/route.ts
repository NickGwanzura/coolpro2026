import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { installations } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { Installation } from '@/types/index';

function toInstallation(row: typeof installations.$inferSelect): Installation {
  return {
    id: row.id,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    clientName: row.clientName,
    location: row.location ?? undefined,
    jobDetails: row.jobDetails,
    floorSpace: row.floorSpace ?? '',
    jobType: row.jobType as Installation['jobType'],
    installationDate: row.installationDate.toISOString(),
    equipmentId: row.equipmentId ?? undefined,
    status: row.status as Installation['status'],
    images: row.images,
    cocRequested: row.cocRequested,
    cocApproved: row.cocApproved,
    cocApprovalDate: row.cocApprovalDate?.toISOString() ?? undefined,
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let session;
  try {
    session = requireRole(req, ['technician', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as Partial<Installation>;

  const [existing] = await db
    .select()
    .from(installations)
    .where(eq(installations.id, id));

  if (!existing) {
    return NextResponse.json({ error: 'Installation not found' }, { status: 404 });
  }

  if (session.role === 'technician' && existing.technicianId !== session.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const updateFields: Record<string, unknown> = {};
  if (body.status) updateFields.status = body.status;
  if (body.cocRequested !== undefined) updateFields.cocRequested = body.cocRequested;
  if (body.cocApproved !== undefined) updateFields.cocApproved = body.cocApproved;
  if (body.cocApprovalDate !== undefined) updateFields.cocApprovalDate = body.cocApprovalDate ? new Date(body.cocApprovalDate) : null;
  updateFields.updatedAt = new Date();

  const [updated] = await db
    .update(installations)
    .set(updateFields)
    .where(eq(installations.id, id))
    .returning();

  return NextResponse.json(toInstallation(updated));
}
