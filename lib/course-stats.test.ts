import { describe, expect, it } from 'vitest';
import { pickReadyForCertificate, summariseCourseStats } from './course-stats';

describe('summariseCourseStats', () => {
  const submissions = [
    { courseId: 'a', studentId: 's1', status: 'graded', passed: false },
    { courseId: 'a', studentId: 's1', status: 'graded', passed: true },
    { courseId: 'a', studentId: 's2', status: 'graded', passed: false },
    { courseId: 'a', studentId: 's3', status: 'pending', passed: null },
    { courseId: 'b', studentId: 's9', status: 'pending', passed: null },
  ];
  const enrollments = [{ courseId: 'a' }, { courseId: 'a' }, { courseId: 'a' }, { courseId: 'b' }, { courseId: 'zzz' }];

  it('counts learners, not attempts, for the pass rate', () => {
    const [a] = summariseCourseStats(['a'], enrollments, submissions);
    expect(a).toMatchObject({ enrolled: 3, submissions: 4, pendingGrading: 1, learnersGraded: 2, learnersPassed: 1, passRate: 50 });
  });

  it('has no pass rate until someone has been graded', () => {
    const [, b] = summariseCourseStats(['a', 'b'], enrollments, submissions);
    expect(b).toMatchObject({ enrolled: 1, pendingGrading: 1, learnersGraded: 0, passRate: null });
  });

  it('reports a course nobody has touched as all zeros', () => {
    expect(summariseCourseStats(['new'], enrollments, submissions)[0]).toEqual({
      courseId: 'new', enrolled: 0, submissions: 0, pendingGrading: 0, learnersGraded: 0, learnersPassed: 0, passRate: null,
    });
  });
});

describe('pickReadyForCertificate', () => {
  const day = (n: number) => new Date(Date.UTC(2026, 9, n));
  const passed = [
    { id: '1', studentName: 'Ada', courseTitle: 'RAC', score: 80.4, gradedAt: day(1) },
    { id: '2', studentName: 'Ben', courseTitle: 'RAC', score: 91, gradedAt: day(5) },
    { id: '3', studentName: 'Cy', courseTitle: 'Safety', score: null, gradedAt: null },
  ];

  it('leaves out learners who already have a request and puts the newest pass first', () => {
    const result = pickReadyForCertificate(passed, new Set(['1']));
    expect(result.map((r) => r.submissionId)).toEqual(['2', '3']);
    expect(result[0]).toMatchObject({ studentName: 'Ben', score: 91 });
    expect(result[1].score).toBe(0);
  });

  it('caps the list', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: String(i), studentName: 'x', courseTitle: 'y', score: 70, gradedAt: day(1 + (i % 25)) }));
    expect(pickReadyForCertificate(many, new Set(), 5)).toHaveLength(5);
  });
});
