// Per-course figures for trainers: who enrolled, how the exams are going, who is ready for a
// certificate. Pure, so the counting rules can be tested without a database.

export interface CourseStat {
  courseId: string;
  enrolled: number;
  submissions: number;
  pendingGrading: number;
  /** Distinct learners with at least one graded attempt. */
  learnersGraded: number;
  /** Distinct learners who passed. */
  learnersPassed: number;
  /** Percentage of graded learners who passed, or null before anyone has been graded. */
  passRate: number | null;
}

export function summariseCourseStats(
  courseIds: string[],
  enrollments: Array<{ courseId: string }>,
  submissions: Array<{ courseId: string; studentId: string; status: string; passed: boolean | null }>,
): CourseStat[] {
  return courseIds.map((courseId) => {
    const mine = submissions.filter((s) => s.courseId === courseId);
    const graded = new Set(mine.filter((s) => s.status === 'graded').map((s) => s.studentId));
    const passed = new Set(mine.filter((s) => s.status === 'graded' && s.passed === true).map((s) => s.studentId));
    return {
      courseId,
      enrolled: enrollments.filter((e) => e.courseId === courseId).length,
      submissions: mine.length,
      pendingGrading: mine.filter((s) => s.status === 'pending').length,
      learnersGraded: graded.size,
      learnersPassed: passed.size,
      passRate: graded.size === 0 ? null : Math.round((passed.size / graded.size) * 100),
    };
  });
}

export interface ReadyForCertificate {
  submissionId: string;
  studentName: string;
  courseTitle: string;
  score: number;
}

/** Learners who passed an exam but have no certificate request yet, newest pass first. */
export function pickReadyForCertificate(
  passed: Array<{ id: string; studentName: string; courseTitle: string; score: number | null; gradedAt: Date | null }>,
  alreadyRequestedSubmissionIds: ReadonlySet<string>,
  limit = 8,
): ReadyForCertificate[] {
  return passed
    .filter((submission) => !alreadyRequestedSubmissionIds.has(submission.id))
    .sort((a, b) => (b.gradedAt?.getTime() ?? 0) - (a.gradedAt?.getTime() ?? 0))
    .slice(0, limit)
    .map((submission) => ({
      submissionId: submission.id,
      studentName: submission.studentName,
      courseTitle: submission.courseTitle,
      score: Math.round(Number(submission.score ?? 0)),
    }));
}
