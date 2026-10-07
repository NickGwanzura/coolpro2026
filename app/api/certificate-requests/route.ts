import { NextResponse } from 'next/server';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { trainerCertificateRequests, technicians } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { toTrainerCertificateRequest } from '@/lib/server/request-serializers';
import type { TrainerCertificateRequest } from '@/types/index';

export async function GET(req: Request) {
  let session;
  try {
    session = await requireRole(req, ['trainer', 'lecturer', 'org_admin', 'technician']);
  } catch (e) {
    return e as Response;
  }

  let rows;
  if (session.role === 'org_admin') {
    rows = await db.select().from(trainerCertificateRequests).orderBy(desc(trainerCertificateRequests.submittedAt));
  } else if (session.role === 'technician') {
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

  const body = await req.json().catch(() => ({})) as Partial<TrainerCertificateRequest>;

  const required: Array<keyof TrainerCertificateRequest> = [
    'technicianId', 'technicianName', 'technicianRegistrationNumber',
    'courseTitle', 'examDate', 'theoryScore', 'practicalScore',
  ];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === '') {
      return NextResponse.json({ error: `${key} is required` }, { status: 400 });
    }
  }

  const theoryScore = Number(body.theoryScore);
  const practicalScore = Number(body.practicalScore);
  if (!Number.isFinite(theoryScore) || !Number.isFinite(practicalScore)) {
    return NextResponse.json({ error: 'theoryScore and practicalScore must be valid numbers' }, { status: 400 });
  }

  const [inserted] = await db
    .insert(trainerCertificateRequests)
    .values({
      technicianId: body.technicianId!,
      technicianName: body.technicianName!,
      technicianRegistrationNumber: body.technicianRegistrationNumber!,
      technicianCompany: body.technicianCompany ?? 'Independent technician',
      trainerName: session.name,
      trainerEmail: session.email,
      courseTitle: body.courseTitle!,
      examDate: body.examDate!,
      theoryScore,
      practicalScore,
      overallScore: Math.round((theoryScore + practicalScore) / 2),
      notes: body.notes ?? null,
      status: 'submitted-for-admin-approval',
    })
    .returning();

  return NextResponse.json(toTrainerCertificateRequest(inserted), { status: 201 });
}
