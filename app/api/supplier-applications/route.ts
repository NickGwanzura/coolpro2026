import { NextResponse } from 'next/server';
import { and, eq, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications } from '@/db/schema/index';
import { readSessionFromRequest } from '@/lib/server/auth';
import type { SupplierRegistration } from '@/types/index';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const email = String(body.email).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const registrationNumber = (body.registrationNumber ?? '').trim();

  if (registrationNumber || email) {
    const dupes = await db
      .select({ id: supplierApplications.id, status: supplierApplications.status })
      .from(supplierApplications)
      .where(
        and(
          or(
            registrationNumber
              ? eq(supplierApplications.registrationNumber, registrationNumber)
              : undefined,
            eq(supplierApplications.email, email),
          ),
          or(
            eq(supplierApplications.status, 'submitted'),
            eq(supplierApplications.status, 'under-review'),
            eq(supplierApplications.status, 'approved'),
          ),
        ),
      )
      .limit(1);

    if (dupes.length > 0) {
      return NextResponse.json(
        { error: 'A supplier with this email or registration number already has an active application.' },
        { status: 409 },
      );
    }
  }

  const [inserted] = await db
    .insert(supplierApplications)
    .values({
      companyName: body.companyName.trim(),
      tradingName: body.tradingName ?? null,
      registrationNumber,
      supplierType: (body.supplierType ?? 'distributor') as typeof supplierApplications.$inferInsert['supplierType'],
      contactName: body.contactName.trim(),
      email,
      phone: body.phone ?? '',
      province: body.province ?? '',
      city: body.city ?? '',
      address: body.address ?? '',
      refrigerantsSupplied: body.refrigerantsSupplied ?? [],
      taxNumber: body.taxNumber ?? null,
      pesepayMerchantId: body.pesepayMerchantId ?? null,
      website: body.website ?? null,
      notes: body.notes ?? null,
      status: 'submitted',
      submittedAt: new Date(),
      createdAt: new Date(),
    })
    .returning();

  return NextResponse.json(toSupplierRegistration(inserted), { status: 201 });
}
