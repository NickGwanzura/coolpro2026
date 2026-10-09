import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { technicianApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { afterApplicationRejected, reviewBlockedReason } from '@/lib/server/application-flow';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  // `applicantMessage` (or `notes`, which the reject box sends) is the ONLY text that can appear
  // in the rejection email. `reason` and `internalNotes` are admin-only and never emailed.
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
  const blocked = await reviewBlockedReason('technician_application', row.id, row.status, 'reject');
  if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

  const internalReviewNote = [body.reason ?? body.notes ?? body.applicantMessage, body.internalNotes]
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

  await afterApplicationRejected(
    { entityType: 'technician_application', entityId: row.id, role: 'technician', name: row.name, email: row.email },
    { name: session.name, role: session.role },
    row.status,
    // The note an admin types in the reject box is the message the applicant sees.
    { applicantMessage: body.applicantMessage ?? body.notes, internalNote: internalReviewNote ?? undefined },
  );

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    reviewedAt: updated.reviewedAt?.toISOString(),
    reviewedBy: updated.reviewedBy,
    reviewNote: updated.reviewNote,
  });
}
