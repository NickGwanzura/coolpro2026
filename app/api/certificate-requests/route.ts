import { NextResponse } from 'next/server';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { trainerCertificateRequests, technicians } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { recordAuditEvent } from '@/lib/server/audit';
import { validateCertificateRequest } from '@/lib/server/lms-validation';
import { toTrainerCertificateRequest } from '@/lib/server/request-serializers';
import { isFieldWorkerRole } from '@/lib/field-worker';

export async function GET(req: Request) {
  let session;
  try {
    session = await requireRole(req, ['trainer', 'lecturer', 'org_admin', 'technician', 'contractor']);
  } catch (e) {
    return e as Response;
  }

  let rows;
  if (session.role === 'org_admin') {
    rows = await db.select().from(trainerCertificateRequests).orderBy(desc(trainerCertificateRequests.submittedAt));
  } else if (isFieldWorkerRole(session.role)) {
    const matchingTechnicians = await db.select({ id: technicians.id }).from(technicians).where(eq(technicians.email, session.email));
    const technicianIds = [session.id, ...matchingTechnicians.map((technician) => technician.id)];
    rows = await db
      .select()
      .from(trainerCertificateRequests)
      .where(inArray(trainerCertificateRequests.technicianId, technicianIds))
      .orderBy(desc(trainerCertificateRequests.submittedAt));
  } else {
    rows = await db
      .select()
      .from(trainerCertificateRequests)
      .where(eq(trainerCertificateRequests.trainerEmail, session.email))
      .orderBy(desc(trainerCertificateRequests.submittedAt));
  }

  return NextResponse.json(rows.map(toTrainerCertificateRequest));
}

export async function POST(req: Request) {
  let session;
  try {
    session = await requireRole(req, ['trainer', 'lecturer']);
  } catch (e) {
    return e as Response;
  }

  const input = validateCertificateRequest(await req.json().catch(() => null));
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 400 });
  const request = input.value;

  // Identity comes from the registry record, never from what the form says.
  const [technician] = await db
    .select({
      id: technicians.id,
      name: technicians.name,
      registrationNumber: technicians.registrationNumber,
      employer: technicians.employer,
      status: technicians.status,
    })
    .from(technicians)
    .where(eq(technicians.id, request.technicianId))
    .limit(1);
  if (!technician) {
    return NextResponse.json({ error: 'That technician is not in the registry.' }, { status: 404 });
  }
  if (technician.registrationNumber.toUpperCase() !== request.technicianRegistrationNumber) {
    return NextResponse.json({ error: 'The registration number does not match that technician.' }, { status: 400 });
  }
  if (technician.status === 'suspended') {
    return NextResponse.json({ error: 'A suspended technician cannot be put forward for a certificate.' }, { status: 409 });
  }

  const [duplicate] = await db
    .select({ id: trainerCertificateRequests.id })
    .from(trainerCertificateRequests)
    .where(and(
      eq(trainerCertificateRequests.technicianId, technician.id),
      eq(trainerCertificateRequests.courseTitle, request.courseTitle),
      eq(trainerCertificateRequests.examDate, request.examDate),
      inArray(trainerCertificateRequests.status, ['submitted-for-admin-approval', 'admin-approved', 'issued']),
    ))
    .limit(1);
  if (duplicate) {
    return NextResponse.json({ error: 'A certificate request for this technician, course and exam date already exists.' }, { status: 409 });
  }

  const [inserted] = await db
    .insert(trainerCertificateRequests)
    .values({
      technicianId: technician.id,
      technicianName: technician.name,
      technicianRegistrationNumber: technician.registrationNumber,
      technicianCompany: technician.employer ?? 'Independent technician',
      trainerName: session.name,
      trainerEmail: session.email,
      courseTitle: request.courseTitle,
      examDate: request.examDate,
      theoryScore: request.theoryScore,
      practicalScore: request.practicalScore,
      overallScore: Math.round((request.theoryScore + request.practicalScore) / 2),
      notes: request.notes,
      status: 'submitted-for-admin-approval',
    })
    .returning();

  await recordAuditEvent({
    entityType: 'certificate_request',
    entityId: inserted.id,
    action: 'certificate_requested',
    newStatus: inserted.status,
    performedBy: session.name,
    performedByRole: session.role,
  });

  return NextResponse.json(toTrainerCertificateRequest(inserted), { status: 201 });
}
