import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trainerCertificateRequests } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { TrainerCertificateRequest } from '@/types/index';

export function toTrainerCertificateRequest(
  row: typeof trainerCertificateRequests.$inferSelect,
): TrainerCertificateRequest {
  return {
    id: row.id,
    technicianId: row.technicianId,
    technicianName: row.technicianName,
    technicianRegistrationNumber: row.technicianRegistrationNumber,
    technicianCompany: row.technicianCompany,
    trainerName: row.trainerName,
    trainerEmail: row.trainerEmail,
    courseTitle: row.courseTitle,
    examDate: row.examDate,
    theoryScore: row.theoryScore,
    practicalScore: row.practicalScore,
    overallScore: row.overallScore,
    notes: row.notes ?? undefined,
    status: row.status as TrainerCertificateRequest['status'],
    submittedAt: row.submittedAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? undefined,
    adminReviewer: row.adminReviewer ?? undefined,
    certificateNumber: row.certificateNumber ?? undefined,
    issuedAt: row.issuedAt?.toISOString() ?? undefined,
    verificationToken: row.verificationToken ?? undefined,
    verificationUrl:
      row.certificateNumber && row.verificationToken
        ? `/verify-technician?mode=certificate&q=${encodeURIComponent(row.certificateNumber)}&token=${row.verificationToken}`
        : undefined,
    cpdCredits: row.cpdCredits ?? undefined,
  };
}

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['trainer', 'lecturer', 'org_admin', 'technician']);
  } catch (e) {
    return e as Response;
  }

  let rows;
  if (session.role === 'org_admin') {
    rows = await db.select().from(trainerCertificateRequests).orderBy(desc(trainerCertificateRequests.submittedAt));
  } else if (session.role === 'technician') {
    rows = await db
      .select()
      .from(trainerCertificateRequests)
      .where(eq(trainerCertificateRequests.technicianId, session.id))
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
    session = requireRole(req, ['trainer', 'lecturer']);
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
