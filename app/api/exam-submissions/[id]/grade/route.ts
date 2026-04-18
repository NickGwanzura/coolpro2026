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

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = requireRole(req, ['trainer', 'lecturer']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [sub] = await db.select().from(examSubmissions).where(eq(examSubmissions.id, id)).limit(1);
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ownCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.lecturerId, session.id));
  const courseIds = ownCourses.map(c => c.id);
  if (!courseIds.includes(sub.courseId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json() as { score: number; passed: boolean; feedback: string };

  const [updated] = await db
    .update(examSubmissions)
    .set({
      score: String(body.score),
      passed: body.passed,
      feedback: body.feedback,
      status: 'graded',
      gradedAt: new Date(),
    })
    .where(eq(examSubmissions.id, id))
    .returning();

  return NextResponse.json(toExamSubmission(updated));
}
