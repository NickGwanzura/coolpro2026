import { NextResponse } from 'next/server';
import { and, eq, isNotNull, ne } from 'drizzle-orm';
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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [updated] = await db
    .update(supplierReorders)
    .set({
      status: 'approved',
      nouReviewerId: session.id,
      nouReviewedAt: new Date(),
    })
    .where(and(
      eq(supplierReorders.id, id),
      eq(supplierReorders.status, 'pending_nou'),
      isNotNull(supplierReorders.hevacrazReviewerId),
      ne(supplierReorders.hevacrazReviewerId, session.id),
    ))
    .returning();

  if (!updated) return NextResponse.json({ error: 'A different admin must review the HEVACRAZ-approved reorder before this action' }, { status: 409 });

  return NextResponse.json(toSupplierReorder(updated));
}
