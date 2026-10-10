import { toSupplierRegistration } from '@/lib/server/request-serializers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { provisionUserFromApplication, ProvisionConflictError } from '@/lib/server/provision-user';
import { afterApplicationApproved, reviewBlockedReason } from '@/lib/server/application-flow';

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

  const blocked = await reviewBlockedReason('supplier_application', id, row.status, 'approve');
  if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

  try {
    await provisionUserFromApplication({
      name: row.contactName,
      email: row.email,
      passwordHash: row.passwordHash,
      role: 'vendor',
      region: row.province || row.city,
    });
  } catch (err) {
    if (err instanceof ProvisionConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const [updated] = await db
    .update(supplierApplications)
    .set({ status: 'approved', reviewedBy: session.name, reviewedAt: new Date() })
    .where(eq(supplierApplications.id, id))
    .returning();

  // Email the supplier and record the decision — best-effort, never blocks approval
  await afterApplicationApproved(
    { entityType: 'supplier_application', entityId: id, role: 'supplier', name: row.contactName, email: row.email },
    { name: session.name, role: session.role },
    row.status,
  );

  return NextResponse.json(toSupplierRegistration(updated));
}
