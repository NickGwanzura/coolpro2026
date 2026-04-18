import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications } from '@/db/schema/index';
import { readSessionFromRequest, requireRole } from '@/lib/server/auth';
import type { SupplierRegistration } from '@/types/index';

function toSupplierRegistration(row: typeof supplierApplications.$inferSelect): SupplierRegistration & {
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string;
} {
  return {
    id: row.id,
    companyName: row.companyName,
    tradingName: row.tradingName ?? undefined,
    registrationNumber: row.registrationNumber,
    supplierType: row.supplierType as SupplierRegistration['supplierType'],
    contactName: row.contactName,
    email: row.email,
    phone: row.phone,
    province: row.province,
    city: row.city,
    address: row.address,
    refrigerantsSupplied: row.refrigerantsSupplied as string[],
    taxNumber: row.taxNumber ?? undefined,
    pesepayMerchantId: row.pesepayMerchantId ?? undefined,
    website: row.website ?? undefined,
    notes: row.notes ?? undefined,
    status: row.status as SupplierRegistration['status'],
    submittedAt: row.submittedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
  };
}

export async function GET(req: Request) {
  const session = readSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role === 'vendor') {
    const rows = await db
      .select()
      .from(supplierApplications)
      .where(eq(supplierApplications.email, session.email));
    return NextResponse.json(rows.map(toSupplierRegistration));
  }

  if (session.role === 'org_admin' || session.role === 'regulator') {
    const rows = await db.select().from(supplierApplications);
    return NextResponse.json(rows.map(toSupplierRegistration));
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: Request) {
  const body = await req.json() as Partial<SupplierRegistration>;

  if (!body.companyName || !body.contactName || !body.email) {
    return NextResponse.json({ error: 'companyName, contactName, and email are required' }, { status: 400 });
  }

  const [inserted] = await db
    .insert(supplierApplications)
    .values({
      companyName: body.companyName,
      tradingName: body.tradingName,
      registrationNumber: body.registrationNumber ?? '',
      supplierType: (body.supplierType ?? 'distributor') as typeof supplierApplications.$inferInsert['supplierType'],
      contactName: body.contactName,
      email: body.email,
      phone: body.phone ?? '',
      province: body.province ?? '',
      city: body.city ?? '',
      address: body.address ?? '',
      refrigerantsSupplied: body.refrigerantsSupplied ?? [],
      taxNumber: body.taxNumber,
      pesepayMerchantId: body.pesepayMerchantId,
      website: body.website,
      notes: body.notes,
      status: 'submitted',
      submittedAt: new Date(),
      createdAt: new Date(),
    })
    .returning();

  return NextResponse.json(toSupplierRegistration(inserted), { status: 201 });
}
