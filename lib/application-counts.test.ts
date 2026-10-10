import { describe, expect, it } from 'vitest';
import { countOpenApplications, sumCounts } from './application-counts';

describe('countOpenApplications', () => {
  const apps = [
    { id: 'a', status: 'submitted' },
    { id: 'b', status: 'under-review' },
    { id: 'c', status: 'submitted' },
    { id: 'd', status: 'approved' },
    { id: 'e', status: 'rejected' },
  ];

  it('separates confirmed applicants (ready for an admin) from unconfirmed ones', () => {
    expect(countOpenApplications(apps, new Set(['c']))).toEqual({ awaitingReview: 2, awaitingEmail: 1 });
  });

  it('ignores finished applications even if their id is in the unconfirmed set', () => {
    expect(countOpenApplications(apps, new Set(['d', 'e']))).toEqual({ awaitingReview: 3, awaitingEmail: 0 });
  });

  it('handles an empty list', () => {
    expect(countOpenApplications([], new Set())).toEqual({ awaitingReview: 0, awaitingEmail: 0 });
  });
});

describe('sumCounts', () => {
  it('adds the lanes together', () => {
    const lane = (awaitingReview: number, awaitingEmail: number) => ({ awaitingReview, awaitingEmail });
    const result = sumCounts({ students: lane(1, 0), technicians: lane(2, 1), professionals: lane(0, 2), suppliers: lane(4, 0) });
    expect(result.total).toEqual({ awaitingReview: 7, awaitingEmail: 3 });
  });
});
