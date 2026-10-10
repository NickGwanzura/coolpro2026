import { describe, expect, it } from 'vitest';
import { examState, progressPercent, sanitizeCompletedModules } from './course-progress';

describe('sanitizeCompletedModules', () => {
  it('keeps valid module numbers, sorted and unique', () => {
    expect(sanitizeCompletedModules([2, 0, 2, 1], 5)).toEqual([0, 1, 2]);
  });

  it('drops out-of-range, negative, fractional and non-numeric values', () => {
    expect(sanitizeCompletedModules([-1, 5, 1.5, '2', null, 4], 5)).toEqual([4]);
  });

  it('returns nothing for a non-array or a course with no modules', () => {
    expect(sanitizeCompletedModules('0,1', 3)).toEqual([]);
    expect(sanitizeCompletedModules(undefined, 3)).toEqual([]);
    expect(sanitizeCompletedModules([0], 0)).toEqual([]);
  });
});

describe('progressPercent', () => {
  it('rounds and clamps', () => {
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(2, 3)).toBe(67);
    expect(progressPercent(3, 3)).toBe(100);
    expect(progressPercent(9, 3)).toBe(100);
    expect(progressPercent(0, 0)).toBe(0);
  });
});

describe('examState', () => {
  it('has not been taken with no submissions', () => {
    expect(examState([])).toEqual({ state: 'not-taken', attempts: 0 });
  });
  it('awaits grading while a submission is pending', () => {
    expect(examState([{ status: 'graded', passed: false }, { status: 'pending' }])).toEqual({ state: 'awaiting-grading', attempts: 2 });
  });
  it('is passed once any attempt passed', () => {
    expect(examState([{ status: 'graded', passed: false }, { status: 'graded', passed: true }])).toEqual({ state: 'passed', attempts: 2 });
  });
  it('is failed when every graded attempt failed and none is pending', () => {
    expect(examState([{ status: 'graded', passed: false }])).toEqual({ state: 'failed', attempts: 1 });
  });
});
