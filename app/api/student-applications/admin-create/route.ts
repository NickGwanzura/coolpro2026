import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { studentApplications, invites } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { provisionUserFromApplication, ProvisionConflictError } from '@/lib/server/provision-user';
import { sendInviteEmail } from '@/lib/server/email';
import { logEmail } from '@/lib/server/email-log';
import { SITE_URL } from '@/lib/site-url';
import type { StudentApplication, StudentSurveyData } from '@/types/index';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Admin-only "Direct Entry" for students — mirrors the technician-registry/add pattern.
 * Since self-signup is closed, there is no applicant-chosen password here: the account is
 * provisioned with passwordHash: null (status 'pending') and a secure activation link is
 * emailed via the existing invites flow, matching how manual memberships are created.
 */
export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const body = (await req.json().catch(() => ({}))) as Partial<StudentApplication> & {
    firstName?: string; lastName?: string; email?: string; phone?: string;
    polytech?: string; fieldOfStudy?: string; studentIdNumber?: string; enrolmentYear?: number;
    surveyData?: StudentSurveyData;
  };

  const required = ['firstName', 'lastName', 'email', 'phone', 'polytech', 'fieldOfStudy', 'studentIdNumber', 'enrolmentYear'] as const;
  for (const key of required) {
    if (!body[key]) return NextResponse.json({ error: `${key} is required` }, { status: 400 });
  }

  const email = String(body.email).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const name = `${body.firstName} ${body.lastName}`.trim();

  const [inserted] = await db
    .insert(studentApplications)
    .values({
      firstName: String(body.firstName).trim(),
      lastName: String(body.lastName).trim(),
      email,
      passwordHash: null,
      phone: String(body.phone).trim(),
      polytech: String(body.polytech).trim(),
      fieldOfStudy: String(body.fieldOfStudy).trim(),
      studentIdNumber: String(body.studentIdNumber).trim(),
      enrolmentYear: Number(body.enrolmentYear),
      surveyData: body.surveyData ?? null,
      status: 'approved',
      reviewedBy: session.name,
      reviewedAt: new Date(),
    })
    .returning();

  try {
    await provisionUserFromApplication({
      name,
      email,
      passwordHash: null,
      role: 'student',
      region: inserted.polytech,
    });
  } catch (err) {
    if (err instanceof ProvisionConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(invites).values({
    email,
    role: 'student',
    region: inserted.polytech,
    token,
    invitedBy: session.email,
    expiresAt,
  }).catch(() => {});

  const inviteUrl = `${SITE_URL}/accept-invite?token=${token}`;
  sendInviteEmail({ email, inviteUrl, role: 'student', invitedBy: session.name })
    .then((result) => logEmail({
      emailType: 'account_activation',
      recipientEmail: email,
      relatedEntityType: 'student_application',
      relatedEntityId: inserted.id,
      sent: result.sent,
    }))
    .catch(() => {});

  return NextResponse.json({
    id: inserted.id,
    status: inserted.status,
  }, { status: 201 });
}
