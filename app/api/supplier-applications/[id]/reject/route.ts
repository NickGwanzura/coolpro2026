import { toSupplierRegistration } from '@/lib/server/request-serializers';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { supplierApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { afterApplicationRejected, reviewBlockedReason } from '@/lib/server/application-flow';

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

  const blocked = await reviewBlockedReason('supplier_application', id, row.status, 'reject');
  if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

  // `applicantMessage` (or `notes`, which the reject box sends) is what the applicant is emailed.
  const body = await req.json().catch(() => ({})) as { notes?: string; applicantMessage?: string; internalNotes?: string };
  const applicantMessage = (body.applicantMessage ?? body.notes)?.trim().slice(0, 1000) || undefined;
  const internalNote = body.internalNotes?.trim().slice(0, 1000) || undefined;

  const [updated] = await db
    .update(supplierApplications)
    .set({
      status: 'rejected',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      reviewNote: [applicantMessage, internalNote].filter(Boolean).join(' | ') || null,
    })
    .where(eq(supplierApplications.id, id))
    .returning();

  await afterApplicationRejected(
    { entityType: 'supplier_application', entityId: id, role: 'supplier', name: row.contactName, email: row.email },
    { name: session.name, role: session.role },
    row.status,
    { applicantMessage, internalNote },
  );

  return NextResponse.json(toSupplierRegistration(updated));
}
