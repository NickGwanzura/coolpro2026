import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db/client';
import { courseEnrollments, courses, examSubmissions, trainerCertificateRequests } from '@/db/schema/index';
import { requireRole } from '@/lib/server/auth';
import { pickReadyForCertificate, summariseCourseStats } from '@/lib/course-stats';

/**
 * For a trainer or lecturer's own courses (all courses for an admin): enrolments, exam results and
 * who has passed but has no certificate request yet.
 */
export async function GET(req: Request) {
  let session;
  try {
    session = await requireRole(req, ['trainer', 'lecturer', 'org_admin']);
  } catch (e) {
    return e as Response;
  }

  const owned = await db
    .select({ id: courses.id })
    .from(courses)
    .where(session.role === 'org_admin' ? undefined : eq(courses.lecturerId, session.id));
  const courseIds = owned.map((course) => course.id);
  if (courseIds.length === 0) return NextResponse.json({ courses: [], readyForCertificate: [] });

  const [enrollments, submissions, requested] = await Promise.all([
    db.select({ courseId: courseEnrollments.courseId }).from(courseEnrollments).where(inArray(courseEnrollments.courseId, courseIds)),
    db
      .select({
        id: examSubmissions.id,
        courseId: examSubmissions.courseId,
        courseTitle: examSubmissions.courseTitle,
        studentId: examSubmissions.studentId,
        studentName: examSubmissions.studentName,
        status: examSubmissions.status,
        passed: examSubmissions.passed,
        score: examSubmissions.score,
        gradedAt: examSubmissions.gradedAt,
      })
      .from(examSubmissions)
      .where(inArray(examSubmissions.courseId, courseIds)),
    db
      .select({ examSubmissionId: trainerCertificateRequests.examSubmissionId })
      .from(trainerCertificateRequests)
      .where(and(inArray(trainerCertificateRequests.status, ['submitted-for-admin-approval', 'admin-approved', 'issued']))),
  ]);

  const requestedIds = new Set(requested.map((row) => row.examSubmissionId).filter((id): id is string => id !== null));
  const passedSubmissions = submissions
    .filter((submission) => submission.status === 'graded' && submission.passed === true)
    .map((submission) => ({
      id: submission.id,
      studentName: submission.studentName,
      courseTitle: submission.courseTitle,
      score: submission.score === null ? null : Number(submission.score),
      gradedAt: submission.gradedAt,
    }));

  return NextResponse.json({
    courses: summariseCourseStats(courseIds, enrollments, submissions),
    readyForCertificate: pickReadyForCertificate(passedSubmissions, requestedIds),
  });
}
