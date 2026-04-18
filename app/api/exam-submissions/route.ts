import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { examSubmissions, courses } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import type { ExamSubmission } from '@/lib/platformStore';

function toExamSubmission(row: typeof examSubmissions.$inferSelect): ExamSubmission {
  return {
    id: row.id,
    courseId: row.courseId,
    courseTitle: row.courseTitle,
    studentId: row.studentId,
    studentName: row.studentName,
    answers: row.answers as ExamSubmission['answers'],
    score: row.score !== null ? Number(row.score) : undefined,
    passed: row.passed ?? undefined,
    feedback: row.feedback ?? undefined,
    status: row.status as ExamSubmission['status'],
    submittedAt: row.submittedAt.toISOString(),
    gradedAt: row.gradedAt?.toISOString() ?? undefined,
  };
}

export async function GET(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician', 'trainer', 'lecturer', 'regulator', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  if (session.role === 'technician') {
    const rows = await db
      .select()
      .from(examSubmissions)
      .where(eq(examSubmissions.studentId, session.id));
    return NextResponse.json(rows.map(toExamSubmission));
  }

  if (session.role === 'trainer' || session.role === 'lecturer') {
    const ownCourses = await db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.lecturerId, session.id));
    const courseIds = ownCourses.map(c => c.id);
    if (courseIds.length === 0) return NextResponse.json([]);
    const rows = await db
      .select()
      .from(examSubmissions)
      .where(inArray(examSubmissions.courseId, courseIds));
    return NextResponse.json(rows.map(toExamSubmission));
  }

  const rows = await db.select().from(examSubmissions);
  return NextResponse.json(rows.map(toExamSubmission));
}

export async function POST(req: Request) {
  let session;
  try {
    session = requireRole(req, ['technician']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json() as Omit<ExamSubmission, 'id' | 'status' | 'submittedAt'>;
  const now = new Date();

  const [inserted] = await db
    .insert(examSubmissions)
    .values({
      courseId: body.courseId,
      courseTitle: body.courseTitle,
      studentId: session.id,
      studentName: body.studentName,
      answers: body.answers,
      status: 'pending',
      submittedAt: now,
    })
    .returning();

  return NextResponse.json(toExamSubmission(inserted), { status: 201 });
}
