import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(supplierApplications).where(eq(supplierApplications.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [updated] = await db
    .update(supplierApplications)
    .set({ status: 'approved', reviewedBy: session.name, reviewedAt: new Date() })
    .where(eq(supplierApplications.id, id))
    .returning();

  return NextResponse.json(toSupplierRegistration(updated));
}
