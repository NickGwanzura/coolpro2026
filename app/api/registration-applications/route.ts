import { ACCOUNT_EXISTS_MESSAGE, accountExistsFor } from '@/lib/server/applicant-lookup';
import { NextResponse } from 'next/server';
import { and, desc, eq, or } from 'drizzle-orm';
import { db } from '@/db/client';
import { registrationApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { hashPassword } from '@/lib/server/password';
import { checkRateLimit, getClientIp } from '@/lib/server/rate-limit';
import { SELF_SIGNUP_OPEN } from '@/lib/signup-config';
import { startApplicantVerification } from '@/lib/server/application-flow';
import { pendingVerificationIds } from '@/lib/server/email-verification';
import { validateRegistrationApplication } from '@/lib/server/registration-validation';
import { toRegistrationApplication } from '@/lib/server/registration-serializers';

const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_RATE_WINDOW_MS = 15 * 60 * 1000;

export async function GET(req: Request) {
  try {
    await requireRole(req, ['org_admin']);
  } catch (e) {
    return e as Response;
  }

  const rows = await db.select().from(registrationApplications).orderBy(desc(registrationApplications.submittedAt));
  const unconfirmed = await pendingVerificationIds('registration_application', rows.map((row) => row.id));
  return NextResponse.json(rows.map((row) => toRegistrationApplication(row, unconfirmed.has(row.id))));
}

/** Public: a trainer, lecturer or contractor applies. Nothing is created until an admin approves. */
export async function POST(req: Request) {
  if (!checkRateLimit(`registration-application:${getClientIp(req)}`, SIGNUP_RATE_LIMIT, SIGNUP_RATE_WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many applications from this address. Try again later.' }, { status: 429 });
  }

  const parsed = validateRegistrationApplication(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  if (!SELF_SIGNUP_OPEN[input.role]) {
    return NextResponse.json({ error: 'Registration for this role is currently closed.' }, { status: 403 });
  }

  if (await accountExistsFor(input.email)) {
    return NextResponse.json({ error: ACCOUNT_EXISTS_MESSAGE }, { status: 409 });
  }

  const [duplicate] = await db
    .select({ id: registrationApplications.id })
    .from(registrationApplications)
    .where(and(
      eq(registrationApplications.email, input.email),
      or(eq(registrationApplications.status, 'submitted'), eq(registrationApplications.status, 'under-review')),
    ))
    .limit(1);
  if (duplicate) {
    return NextResponse.json({ error: 'An application with this email is already under review.' }, { status: 409 });
  }

  const [inserted] = await db
    .insert(registrationApplications)
    .values({
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      phone: input.phone,
      region: input.region,
      organisation: input.organisation,
      experienceSummary: input.experienceSummary,
      details: input.details,
      idDocumentName: input.idDocumentName,
      status: 'submitted',
    })
    .returning();

  await startApplicantVerification({
    entityType: 'registration_application',
    entityId: inserted.id,
    role: inserted.role,
    name: `${inserted.firstName} ${inserted.lastName}`.trim(),
    email: inserted.email,
  });

  return NextResponse.json({ id: inserted.id, status: inserted.status, role: inserted.role }, { status: 201 });
}
