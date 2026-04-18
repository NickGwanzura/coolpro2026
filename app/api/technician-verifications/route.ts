import { NextResponse } from 'next/server';
import { eq, ilike } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicianVerifications, technicians } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { TechnicianVerification, VerificationMethod, VerificationResult } from '@/lib/platformStore';
import type { Technician } from '@/types/index';

function toVerification(row: typeof technicianVerifications.$inferSelect): TechnicianVerification {
  return {
    id: row.id,
    vendorId: row.vendorId,
    vendorName: row.vendorName,
    method: row.method as VerificationMethod,
    query: row.query,
    technicianId: row.technicianId ?? undefined,
    result: row.result as VerificationResult,
    createdAt: row.createdAt.toISOString(),
  };
}

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

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['vendor', 'regulator', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  if (session.role === 'vendor') {
    const rows = await db
      .select()
      .from(technicianVerifications)
      .where(eq(technicianVerifications.vendorId, session.id));
    return NextResponse.json(rows.map(toVerification));
  }

  const rows = await db.select().from(technicianVerifications);
  return NextResponse.json(rows.map(toVerification));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['vendor']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json() as { method: VerificationMethod; query: string };

  let techRow: typeof technicians.$inferSelect | undefined;

  if (body.method === 'reg_number') {
    const [found] = await db
      .select()
      .from(technicians)
      .where(eq(technicians.registrationNumber, body.query))
      .limit(1);
    techRow = found;
  } else if (body.method === 'qr') {
    const [found] = await db
      .select()
      .from(technicians)
      .where(eq(technicians.qrToken, body.query))
      .limit(1);
    techRow = found;
  } else {
    const [found] = await db
      .select()
      .from(technicians)
      .where(ilike(technicians.name, `%${body.query}%`))
      .limit(1);
    techRow = found;
  }

  let result: VerificationResult;
  if (!techRow) {
    result = 'not_found';
  } else if (techRow.status === 'suspended') {
    result = 'revoked';
  } else {
    const expiry = new Date(techRow.expiryDate);
    result = expiry < new Date() ? 'expired' : 'valid';
  }

  const [inserted] = await db
    .insert(technicianVerifications)
    .values({
      vendorId: session.id,
      vendorName: session.name,
      method: body.method,
      query: body.query,
      technicianId: techRow?.id ?? null,
      result,
      createdAt: new Date(),
    })
    .returning();

  return NextResponse.json({
    technician: techRow ? toTechnician(techRow) : null,
    result,
    verification: toVerification(inserted),
  }, { status: 201 });
}
