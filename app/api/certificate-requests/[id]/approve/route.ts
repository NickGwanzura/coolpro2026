import { notifyUserByEmail } from '@/lib/server/notifications';
import { notificationTemplates } from '@/lib/notification-templates';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trainerCertificateRequests } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { recordAuditEvent } from '@/lib/server/audit';
import { toTrainerCertificateRequest } from '@/lib/server/request-serializers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [existing] = await db.select({ status: trainerCertificateRequests.status }).from(trainerCertificateRequests).where(eq(trainerCertificateRequests.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'submitted-for-admin-approval') return NextResponse.json({ error: `A ${existing.status} request cannot be approved.` }, { status: 409 });
  const [updated] = await db
    .update(trainerCertificateRequests)
    .set({ status: 'admin-approved', reviewedAt: new Date(), adminReviewer: session.name })
    .where(eq(trainerCertificateRequests.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await recordAuditEvent({
    entityType: 'certificate_request',
    entityId: id,
    action: 'certificate_approved',
    previousStatus: 'submitted-for-admin-approval',
    newStatus: 'admin-approved',
    performedBy: session.name,
    performedByRole: session.role,
  });
  await notifyUserByEmail(updated.trainerEmail, notificationTemplates.certificateRequest('admin-approved', updated.courseTitle, updated.technicianName));
  return NextResponse.json(toTrainerCertificateRequest(updated));
}
