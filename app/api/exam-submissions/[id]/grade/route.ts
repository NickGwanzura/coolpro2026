import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { examSubmissions, courses } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { recordAuditEvent } from '@/lib/server/audit';
import { validateGrade } from '@/lib/server/lms-validation';
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
    session = await requireRole(req, ['trainer', 'lecturer']);
  } catch (e) {
    return e as Response;
  }

  const { id } = await params;
  const [sub] = await db.select().from(examSubmissions).where(eq(examSubmissions.id, id)).limit(1);
  if (!sub) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [course] = await db
    .select({ lecturerId: courses.lecturerId, passMark: courses.passMark })
    .from(courses)
    .where(eq(courses.id, sub.courseId))
    .limit(1);
  if (!course || course.lecturerId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const grade = validateGrade(await req.json().catch(() => null), course.passMark);
  if (!grade.ok) return NextResponse.json({ error: grade.error }, { status: 400 });
  const { score, passed, feedback } = grade.value;

  const [updated] = await db
    .update(examSubmissions)
    .set({ score: String(score), passed, feedback, status: 'graded', gradedAt: new Date() })
    .where(eq(examSubmissions.id, id))
    .returning();

  // Re-grading is allowed, but every change keeps the previous result in the audit trail.
  await recordAuditEvent({
    entityType: 'exam_submission',
    entityId: id,
    action: sub.status === 'graded' ? 'exam_regraded' : 'exam_graded',
    previousStatus: sub.status === 'graded' ? `${sub.passed ? 'passed' : 'failed'} (${sub.score})` : sub.status,
    newStatus: `${passed ? 'passed' : 'failed'} (${score})`,
    performedBy: session.name,
    performedByRole: session.role,
  });

  return NextResponse.json(toExamSubmission(updated));
}
