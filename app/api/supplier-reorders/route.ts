import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierReorders } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { SupplierReorder } from '@/lib/platformStore';

function toSupplierReorder(row: typeof supplierReorders.$inferSelect): SupplierReorder {
  return {
    id: row.id,
    vendorId: row.vendorId,
    vendorName: row.vendorName,
    gasType: row.gasType,
    quantityKg: Number(row.quantityKg),
    purpose: row.purpose,
    supplierNotes: row.supplierNotes,
    status: row.status as SupplierReorder['status'],
    hevacrazReviewerId: row.hevacrazReviewerId ?? undefined,
    hevacrazReviewedAt: row.hevacrazReviewedAt?.toISOString() ?? undefined,
    nouReviewerId: row.nouReviewerId ?? undefined,
    nouReviewedAt: row.nouReviewedAt?.toISOString() ?? undefined,
    rejectionReason: row.rejectionReason ?? undefined,
    rejectedBy: row.rejectedBy ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['vendor', 'org_admin', 'regulator']);
  } catch (e) {
    return e as Response;
  }

  if (session.role === 'vendor') {
    const rows = await db
      .select()
      .from(supplierReorders)
      .where(eq(supplierReorders.vendorId, session.id));
    return NextResponse.json(rows.map(toSupplierReorder));
  }

  if (session.role === 'org_admin') {
    const rows = await db
      .select()
      .from(supplierReorders)
      .where(inArray(supplierReorders.status, ['pending_hevacraz', 'pending_nou', 'approved', 'rejected']));
    return NextResponse.json(rows.map(toSupplierReorder));
  }

  const rows = await db
    .select()
    .from(supplierReorders)
    .where(inArray(supplierReorders.status, ['pending_nou', 'approved', 'rejected']));
  return NextResponse.json(rows.map(toSupplierReorder));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['vendor']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json() as Pick<SupplierReorder, 'gasType' | 'quantityKg' | 'purpose' | 'supplierNotes'>;

  const [inserted] = await db
    .insert(supplierReorders)
    .values({
      vendorId: session.id,
      vendorName: session.name,
      gasType: body.gasType,
      quantityKg: String(body.quantityKg),
      purpose: body.purpose,
      supplierNotes: body.supplierNotes ?? '',
      status: 'pending_hevacraz',
      createdAt: new Date(),
    })
    .returning();

  return NextResponse.json(toSupplierReorder(inserted), { status: 201 });
}
