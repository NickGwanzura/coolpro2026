import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicians } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { Technician } from '@/types/index';

function toTechnician(row: typeof technicians.$inferSelect): Technician {
  return {
    id: row.id,
    name: row.name,
    nationalId: row.nationalId,
    registrationNumber: row.registrationNumber,
    region: row.region,
    province: row.province,
    district: row.district,
    contactNumber: row.contactNumber,
    email: row.email ?? undefined,
    specialization: row.specialization,
    certifications: row.certifications as Technician['certifications'],
    trainingHistory: row.trainingHistory as Technician['trainingHistory'],
    employmentStatus: row.employmentStatus as Technician['employmentStatus'],
    employer: row.employer ?? undefined,
    refrigerantsHandled: row.refrigerantsHandled as string[],
    supplierId: row.supplierId ?? undefined,
    registrationDate: row.registrationDate,
    expiryDate: row.expiryDate,
    status: row.status as Technician['status'],
    lastRenewalDate: row.lastRenewalDate ?? undefined,
    nextRenewalDate: row.nextRenewalDate ?? undefined,
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(req, ['technician', 'trainer', 'lecturer', 'org_admin', 'regulator']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(toTechnician(row));
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(req, ['org_admin', 'regulator']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;

  const [existing] = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json() as Partial<Pick<Technician, 'status' | 'name' | 'registrationNumber' | 'region' | 'certifications'>>;

  const updates: Partial<typeof technicians.$inferInsert> = {};
  if (body.status !== undefined) updates.status = body.status as typeof existing.status;
  if (body.name !== undefined) updates.name = body.name;
  if (body.registrationNumber !== undefined) updates.registrationNumber = body.registrationNumber;
  if (body.region !== undefined) updates.region = body.region;
  if (body.certifications !== undefined) updates.certifications = body.certifications;

  const [updated] = await db
    .update(technicians)
    .set(updates)
    .where(eq(technicians.id, id))
    .returning();

  return NextResponse.json(toTechnician(updated));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;

  const [existing] = await db.select().from(technicians).where(eq(technicians.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.delete(technicians).where(eq(technicians.id, id));

  return new Response(null, { status: 204 });
}
