import { notifyRegistryTechnician, notifyUserByEmail } from '@/lib/server/notifications';
import { notificationTemplates } from '@/lib/notification-templates';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trainerCertificateRequests } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { recordAuditEvent } from '@/lib/server/audit';
import { toTrainerCertificateRequest } from '@/lib/server/request-serializers';
import { DEFAULT_CPD_CREDITS } from '@/lib/server/lms-validation';

function generateCertificateNumber() {
  return `HEV-${randomBytes(12).toString('hex').toUpperCase()}`;
}

function generateVerificationToken() {
  return `verify-${randomBytes(32).toString('hex')}`;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [existing] = await db
    .select()
    .from(trainerCertificateRequests)
    .where(eq(trainerCertificateRequests.id, id))
    .limit(1);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status !== 'admin-approved') {
    return NextResponse.json({ error: 'Only an admin-approved certificate request can be issued.' }, { status: 409 });
  }

  const [updated] = await db
    .update(trainerCertificateRequests)
    .set({
      status: 'issued',
      issuedAt: new Date(),
      certificateNumber: existing.certificateNumber ?? generateCertificateNumber(),
      verificationToken: existing.verificationToken ?? generateVerificationToken(),
      cpdCredits: existing.cpdCredits ?? DEFAULT_CPD_CREDITS,
    })
    .where(eq(trainerCertificateRequests.id, id))
    .returning();

  await recordAuditEvent({
    entityType: 'certificate_request',
    entityId: id,
    action: 'certificate_issued',
    previousStatus: 'admin-approved',
    newStatus: 'issued',
    performedBy: session.name,
    performedByRole: session.role,
    notes: updated.certificateNumber ?? undefined,
  });

  const issued = notificationTemplates.certificateRequest('issued', updated.courseTitle, updated.technicianName);
  await notifyUserByEmail(updated.trainerEmail, issued);
  await notifyRegistryTechnician(updated.technicianId, issued);
  return NextResponse.json(toTrainerCertificateRequest(updated));
}
