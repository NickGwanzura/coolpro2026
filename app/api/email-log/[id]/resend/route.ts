import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { emailLog } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { canResend } from '@/lib/email-status';
import { describeApplication, resendApplicantVerification } from '@/lib/server/application-flow';
import { sendApplicationReceivedEmail, sendApprovalEmail } from '@/lib/server/email';
import type { ApplicationEntityType } from '@/lib/server/email-verification';

const APPLICATION_TYPES: readonly string[] = ['technician_application', 'student_application', 'supplier_application', 'registration_application'];

/**
 * Sends an email again from the log. Only for kinds that can be rebuilt safely from the record
 * (a fresh confirmation link, an approval, an "in review" notice). Reset and invite emails are
 * never resent from here because they carry one-time links the log does not keep.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [row] = await db.select().from(emailLog).where(eq(emailLog.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!canResend(row.emailType, row.status)) {
    return NextResponse.json({ error: 'This email cannot be sent again from the log.' }, { status: 409 });
  }
  if (!row.relatedEntityType || !row.relatedEntityId || !APPLICATION_TYPES.includes(row.relatedEntityType)) {
    return NextResponse.json({ error: 'The record this email was about could not be found.' }, { status: 409 });
  }

  const entityType = row.relatedEntityType as ApplicationEntityType;
  const application = await describeApplication(entityType, row.relatedEntityId);
  if (!application) return NextResponse.json({ error: 'The application no longer exists.' }, { status: 404 });
  const log = { entityType, entityId: application.entityId, label: application.name };

  if (row.emailType === 'application_verification') {
    const sent = await resendApplicantVerification(entityType, application.entityId);
    if (!sent) return NextResponse.json({ error: 'This application no longer needs its email confirmed.' }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  const result = row.emailType === 'application_approved'
    ? application.status === 'approved'
      ? await sendApprovalEmail({ email: application.email, name: application.name, role: application.role, log })
      : null
    : await sendApplicationReceivedEmail({ email: application.email, name: application.name, role: application.role, log });
  if (result === null) return NextResponse.json({ error: 'That application is not approved, so the approval email would be wrong.' }, { status: 409 });
  if (!result.sent) return NextResponse.json({ error: result.error ?? 'The email could not be sent.' }, { status: 502 });
  void session;
  return NextResponse.json({ ok: true });
}
