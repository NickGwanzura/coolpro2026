import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { examSubmissions, courses, courseEnrollments } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { MAX_EXAM_ATTEMPTS, validateExamAnswers } from '@/lib/server/lms-validation';
import type { ExamSubmission } from '@/lib/platformStore';
import { isFieldWorkerRole } from '@/lib/field-worker';

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
    session = await requireRole(req, ['technician', 'contractor', 'student', 'trainer', 'lecturer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  if (isFieldWorkerRole(session.role) || session.role === 'student') {
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
    session = await requireRole(req, ['technician', 'contractor', 'student']);
  } catch (e) {
    return e as Response;
  }

  const body = await req.json().catch(() => ({})) as Partial<Omit<ExamSubmission, 'id' | 'status' | 'submittedAt'>>;
  const answers = validateExamAnswers(body.answers);
  if (!answers.ok) return NextResponse.json({ error: answers.error }, { status: 400 });
  if (typeof body.courseId !== 'string') {
    return NextResponse.json({ error: 'Choose an approved course before submitting an exam.' }, { status: 400 });
  }
  const [course] = await db.select({ id: courses.id, title: courses.title, status: courses.status }).from(courses).where(eq(courses.id, body.courseId)).limit(1);
  if (!course || course.status !== 'approved') {
    return NextResponse.json({ error: 'Choose an approved course before submitting an exam.' }, { status: 400 });
  }

  const [enrollment] = await db
    .select({ id: courseEnrollments.id })
    .from(courseEnrollments)
    .where(and(eq(courseEnrollments.courseId, course.id), eq(courseEnrollments.userId, session.id)))
    .limit(1);
  if (!enrollment) {
    return NextResponse.json({ error: 'Enrol in this course before submitting its exam.' }, { status: 403 });
  }

  // A learner who has passed is done; one who keeps failing gets MAX_EXAM_ATTEMPTS tries.
  const graded = await db
    .select({ passed: examSubmissions.passed })
    .from(examSubmissions)
    .where(and(
      eq(examSubmissions.courseId, course.id),
      eq(examSubmissions.studentId, session.id),
      eq(examSubmissions.status, 'graded'),
    ));
  if (graded.some((attempt) => attempt.passed === true)) {
    return NextResponse.json({ error: 'You have already passed this course exam.' }, { status: 409 });
  }
  if (graded.length >= MAX_EXAM_ATTEMPTS) {
    return NextResponse.json(
      { error: `You have used all ${MAX_EXAM_ATTEMPTS} attempts for this exam. Ask your trainer or HEVACRAZ to reset it.` },
      { status: 409 },
    );
  }

  // One submission waits for grading at a time, so a learner cannot flood a trainer's queue.
  const [waiting] = await db
    .select({ id: examSubmissions.id })
    .from(examSubmissions)
    .where(and(
      eq(examSubmissions.courseId, course.id),
      eq(examSubmissions.studentId, session.id),
      eq(examSubmissions.status, 'pending'),
    ))
    .limit(1);
  if (waiting) {
    return NextResponse.json({ error: 'You already have a submission for this course waiting to be graded.' }, { status: 409 });
  }

  const now = new Date();

  const [inserted] = await db
    .insert(examSubmissions)
    .values({
      courseId: course.id,
      courseTitle: course.title,
      studentId: session.id,
      studentName: session.name,
      answers: answers.value,
      status: 'pending',
      submittedAt: now,
    })
    .returning();

  return NextResponse.json(toExamSubmission(inserted), { status: 201 });
}
