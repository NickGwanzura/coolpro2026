import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { registrationApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { afterApplicationRejected, reviewBlockedReason } from '@/lib/server/application-flow';
import { toRegistrationApplication } from '@/lib/server/registration-serializers';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  // `applicantMessage` is the only text the applicant ever sees. `internalNote` stays with admins.
  const body = (await req.json().catch(() => ({}))) as { applicantMessage?: string; internalNotes?: string };
  const applicantMessage = body.applicantMessage?.trim().slice(0, 1000) || undefined;
  const internalNote = body.internalNotes?.trim().slice(0, 1000) || undefined;

  const { id } = await params;
  const [row] = await db.select().from(registrationApplications).where(eq(registrationApplications.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const blocked = await reviewBlockedReason('registration_application', id, row.status, 'reject');
  if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

  const [updated] = await db
    .update(registrationApplications)
    .set({
      status: 'rejected',
      reviewedBy: session.name,
      reviewedAt: new Date(),
      reviewNote: [applicantMessage, internalNote].filter(Boolean).join(' | ') || null,
    })
    .where(eq(registrationApplications.id, id))
    .returning();

  await afterApplicationRejected(
    { entityType: 'registration_application', entityId: id, role: row.role, name: `${row.firstName} ${row.lastName}`.trim(), email: row.email },
    { name: session.name, role: session.role },
    row.status,
    { applicantMessage, internalNote },
  );

  return NextResponse.json(toRegistrationApplication(updated));
}
