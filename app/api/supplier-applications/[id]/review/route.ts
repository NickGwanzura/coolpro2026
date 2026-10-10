import { toSupplierRegistration } from '@/lib/server/request-serializers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(supplierApplications).where(eq(supplierApplications.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (row.status === 'approved' || row.status === 'rejected') {
    return NextResponse.json({ error: 'Only submitted supplier applications can be marked under review.' }, { status: 400 });
  }

  const [updated] = await db
    .update(supplierApplications)
    .set({
      status: 'under-review',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      reviewNote: row.reviewNote ?? 'Application opened for admin review.',
    })
    .where(eq(supplierApplications.id, id))
    .returning();

  return NextResponse.json(toSupplierRegistration(updated));
}
