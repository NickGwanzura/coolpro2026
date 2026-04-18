import { NextResponse } from 'next/server';
import { ilike, or } from 'drizzle-orm';
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

export async function GET(req: Request) {
  try {
    requireRole(req, ['technician', 'trainer', 'lecturer', 'org_admin', 'regulator']);
  } catch (e) {
    return e as Response;
  }

  const url = new URL(req.url);
  const q = url.searchParams.get('q');

  if (q) {
    const rows = await db
      .select()
      .from(technicians)
      .where(or(ilike(technicians.name, `%${q}%`), ilike(technicians.registrationNumber, `%${q}%`)));
    return NextResponse.json(rows.map(toTechnician));
  }

  const rows = await db.select().from(technicians);
  return NextResponse.json(rows.map(toTechnician));
}
