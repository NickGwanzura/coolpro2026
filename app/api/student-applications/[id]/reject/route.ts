import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { studentApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { afterApplicationRejected, reviewBlockedReason } from '@/lib/server/application-flow';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  // `applicantMessage` (or `notes`, which the reject box sends) is what the applicant is emailed.
  // `internalNotes` stays with admins.
  const body = (await req.json().catch(() => ({}))) as { notes?: string; applicantMessage?: string; internalNotes?: string };

  const { id } = await params;
  const [row] = await db
    .select()
    .from(studentApplications)
    .where(eq(studentApplications.id, id))
    .limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const blocked = await reviewBlockedReason('student_application', id, row.status, 'reject');
  if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

  const applicantMessage = (body.applicantMessage ?? body.notes)?.trim().slice(0, 1000) || undefined;
  const internalNote = body.internalNotes?.trim().slice(0, 1000) || undefined;

  const [updated] = await db
    .update(studentApplications)
    .set({
      status: 'rejected',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      reviewNote: [applicantMessage, internalNote].filter(Boolean).join(' | ') || null,
    })
    .where(eq(studentApplications.id, id))
    .returning();

  await afterApplicationRejected(
    { entityType: 'student_application', entityId: id, role: 'student', name: `${row.firstName} ${row.lastName}`.trim(), email: row.email },
    { name: session.name, role: session.role },
    row.status,
    { applicantMessage, internalNote },
  );

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    reviewedAt: updated.reviewedAt?.toISOString(),
    reviewedBy: updated.reviewedBy,
    reviewNote: updated.reviewNote,
  });
}
