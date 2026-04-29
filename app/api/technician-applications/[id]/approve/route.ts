import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicianApplications, technicians } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin', 'regulator']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [app] = await db
    .select()
    .from(technicianApplications)
    .where(eq(technicianApplications.id, id))
    .limit(1);
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (app.status === 'approved' && app.approvedTechnicianId) {
    return NextResponse.json({
      id: app.id,
      status: app.status,
      approvedTechnicianId: app.approvedTechnicianId,
    });
  }

  const today = new Date();
  const expiry = new Date(today);
  expiry.setFullYear(today.getFullYear() + 2);

  const [createdTechnician] = await db
    .insert(technicians)
    .values({
      name: app.name,
      nationalId: app.nationalId,
      registrationNumber: app.registrationNumber,
      region: app.region,
      province: app.province,
      district: app.district,
      contactNumber: app.contactNumber,
      email: app.email,
      specialization: app.specialization,
      certifications: app.certifications ?? [],
      trainingHistory: [],
      employmentStatus: app.employmentStatus as 'employed' | 'self-employed' | 'unemployed',
      employer: app.employer,
      refrigerantsHandled: (app.refrigerantsHandled as string[]) ?? [],
      registrationDate: today.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      status: 'active',
    })
    .returning();

  const [updated] = await db
    .update(technicianApplications)
    .set({
      status: 'approved',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      approvedTechnicianId: createdTechnician.id,
    })
    .where(eq(technicianApplications.id, id))
    .returning();

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    approvedTechnicianId: updated.approvedTechnicianId,
    reviewedAt: updated.reviewedAt?.toISOString(),
    reviewedBy: updated.reviewedBy,
  });
}
