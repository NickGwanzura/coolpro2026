import { NextResponse } from 'next/server';
import { and, eq, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications } from '@/db/schema/index';
import { readSessionFromRequest } from '@/lib/server/auth';
import { generateSupplierRegistrationNumber } from '@/lib/server/registration-number';
import { notifyAdminsOfNewApplication } from '@/lib/server/notify-admins';
import { SITE_URL } from '@/lib/site-url';
import type { SupplierRegistration } from '@/types/index';

export async function POST(req: Request) {
  const session = readSessionFromRequest(req);
  if (!session || session.role !== 'vendor') return NextResponse.json({ error: 'A supplier invitation is required.' }, { status: 403 });

  const body = await req.json() as Partial<SupplierRegistration>;
  if (!body.companyName || !body.contactName || !body.phone || !body.province || !body.city || !body.address || !body.refrigerantsSupplied?.length) {
    return NextResponse.json({ error: 'Complete all required company, contact, location, and refrigerant fields.' }, { status: 400 });
  }
  const [existing] = await db.select({ id: supplierApplications.id }).from(supplierApplications).where(and(
    eq(supplierApplications.email, session.email),
    or(eq(supplierApplications.status, 'submitted'), eq(supplierApplications.status, 'under-review'), eq(supplierApplications.status, 'approved')),
  )).limit(1);
  if (existing) return NextResponse.json({ error: 'This supplier invite has already been completed.' }, { status: 409 });

  const [inserted] = await db.insert(supplierApplications).values({
    companyName: body.companyName.trim(), tradingName: body.tradingName ?? null,
    registrationNumber: await generateSupplierRegistrationNumber(),
    supplierType: (body.supplierType ?? 'distributor') as typeof supplierApplications.$inferInsert['supplierType'],
    contactName: body.contactName.trim(), email: session.email, passwordHash: null,
    phone: body.phone.trim(), province: body.province.trim(), city: body.city.trim(), address: body.address.trim(),
    refrigerantsSupplied: body.refrigerantsSupplied, taxNumber: body.taxNumber ?? null,
    pesepayMerchantId: body.pesepayMerchantId ?? null, website: body.website ?? null, notes: body.notes ?? null,
    surveyData: body.surveyData ?? null,
    status: 'submitted', submittedAt: new Date(), createdAt: new Date(),
  }).returning();
  notifyAdminsOfNewApplication({
    applicantName: inserted.contactName,
    applicantEmail: inserted.email,
    roleLabel: 'supplier',
    reviewPath: `${SITE_URL}/admin/applications`,
  }).catch(() => {});
  return NextResponse.json({ ...inserted, submittedAt: inserted.submittedAt.toISOString() }, { status: 201 });
}
