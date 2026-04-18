import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
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
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(supplierReorders).where(eq(supplierReorders.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [updated] = await db
    .update(supplierReorders)
    .set({
      status: 'pending_nou',
      hevacrazReviewerId: session.id,
      hevacrazReviewedAt: new Date(),
    })
    .where(eq(supplierReorders.id, id))
    .returning();

  return NextResponse.json(toSupplierReorder(updated));
}
