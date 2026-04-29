import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { studentApplications } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { StudentApplication } from '@/types/index';

function toStudentApplication(row: typeof studentApplications.$inferSelect): StudentApplication {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    polytech: row.polytech,
    fieldOfStudy: row.fieldOfStudy,
    studentIdNumber: row.studentIdNumber,
    enrolmentYear: row.enrolmentYear,
    idDocumentName: row.idDocumentName ?? undefined,
    status: row.status as StudentApplication['status'],
    reviewedAt: row.reviewedAt?.toISOString() ?? undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    submittedAt: row.submittedAt.toISOString(),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['org_admin', 'regulator']);
  } catch (e) {
    return e as Response;
  }
  void session;

  const rows = await db
    .select()
    .from(studentApplications)
    .orderBy(desc(studentApplications.submittedAt));
  return NextResponse.json(rows.map(toStudentApplication));
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<StudentApplication>;

  const required: Array<keyof StudentApplication> = [
    'firstName', 'lastName', 'email', 'phone', 'polytech',
    'fieldOfStudy', 'studentIdNumber', 'enrolmentYear',
  ];
  for (const key of required) {
    if (!body[key]) {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  const email = String(body.email).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const [duplicate] = await db
    .select({ id: studentApplications.id })
    .from(studentApplications)
    .where(
      and(
        eq(studentApplications.email, email),
        eq(studentApplications.status, 'submitted'),
      ),
    )
    .limit(1);

  if (duplicate) {
    return NextResponse.json(
      { error: 'An application with this email is already under review.' },
      { status: 409 },
    );
  }

  const [inserted] = await db
    .insert(studentApplications)
    .values({
      firstName: String(body.firstName).trim(),
      lastName: String(body.lastName).trim(),
      email,
      phone: String(body.phone).trim(),
      polytech: String(body.polytech).trim(),
      fieldOfStudy: String(body.fieldOfStudy).trim(),
      studentIdNumber: String(body.studentIdNumber).trim(),
      enrolmentYear: Number(body.enrolmentYear),
      idDocumentName: body.idDocumentName ?? null,
      status: 'submitted',
    })
    .returning();

  return NextResponse.json(toStudentApplication(inserted), { status: 201 });
}
