import { describe, expect, it } from 'vitest';
import { checkDecisionAllowed } from './application-rules';

describe('checkDecisionAllowed', () => {
  it('lets an open, confirmed application be approved or rejected', () => {
    for (const status of ['submitted', 'under-review']) {
      expect(checkDecisionAllowed({ status, action: 'approve', emailUnconfirmed: false })).toBeNull();
      expect(checkDecisionAllowed({ status, action: 'reject', emailUnconfirmed: false })).toBeNull();
    }
  });

  it('blocks approving until the email is confirmed, but allows rejecting', () => {
    expect(checkDecisionAllowed({ status: 'submitted', action: 'approve', emailUnconfirmed: true })).toMatch(/confirmed their email/);
    expect(checkDecisionAllowed({ status: 'submitted', action: 'reject', emailUnconfirmed: true })).toBeNull();
  });

  it('does not let a finished application be decided again', () => {
    expect(checkDecisionAllowed({ status: 'approved', action: 'reject', emailUnconfirmed: false })).toBe('A approved application cannot be rejected.');
    expect(checkDecisionAllowed({ status: 'rejected', action: 'approve', emailUnconfirmed: false })).toBe('A rejected application cannot be approved.');
  });
});
