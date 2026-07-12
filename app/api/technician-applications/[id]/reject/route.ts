import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicianApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { sendApplicationRejectedEmail } from '@/lib/server/email';
import { logEmail } from '@/lib/server/email-log';
import { recordAuditEvent } from '@/lib/server/audit';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  // `notes` is kept for backward compatibility with the existing simple reject modal
  // (admin/applications). `reason`/`internalNotes` are internal-only and stored together in
  // reviewNote; `applicantMessage` is the ONLY thing that can ever appear in the rejection
  // email — internal notes must never be interpolated into applicant-facing content.
  const body = (await req.json().catch(() => ({}))) as {
    notes?: string;
    reason?: string;
    internalNotes?: string;
    applicantMessage?: string;
  };

  const { id } = await params;
  const [row] = await db
    .select()
    .from(technicianApplications)
    .where(eq(technicianApplications.id, id))
    .limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const internalReviewNote = [body.reason ?? body.notes, body.internalNotes]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' — ') || null;

  const [updated] = await db
    .update(technicianApplications)
    .set({
      status: 'rejected',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      reviewNote: internalReviewNote,
    })
    .where(eq(technicianApplications.id, id))
    .returning();

  recordAuditEvent({
    entityType: 'technician_application',
    entityId: row.id,
    action: 'rejected',
    previousStatus: row.status,
    newStatus: 'rejected',
    performedBy: session.name,
    performedByRole: session.role,
    notes: internalReviewNote ?? undefined,
  }).catch(() => {});

  sendApplicationRejectedEmail({
    email: row.email,
    name: row.name,
    applicantMessage: body.applicantMessage,
  })
    .then((result) => logEmail({
      emailType: 'application_rejected',
      recipientEmail: row.email,
      relatedEntityType: 'technician_application',
      relatedEntityId: row.id,
      sent: result.sent,
    }))
    .catch(() => {});

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    reviewedAt: updated.reviewedAt?.toISOString(),
    reviewedBy: updated.reviewedBy,
    reviewNote: updated.reviewNote,
  });
}
