import { describe, expect, it } from 'vitest';
import { applicantLoginState } from './applicant-login-message';

describe('applicantLoginState', () => {
  it('asks an unconfirmed applicant to confirm their email first', () => {
    expect(applicantLoginState({ status: 'submitted', emailUnconfirmed: true })?.code).toBe('email_unconfirmed');
    expect(applicantLoginState({ status: 'under-review', emailUnconfirmed: true })?.code).toBe('email_unconfirmed');
  });

  it('tells a confirmed applicant the review is under way', () => {
    const state = applicantLoginState({ status: 'submitted', emailUnconfirmed: false });
    expect(state?.code).toBe('application_pending');
    expect(state?.message).toMatch(/still being reviewed/);
  });

  it('points a rejected applicant to the email and the Join page', () => {
    const state = applicantLoginState({ status: 'rejected', emailUnconfirmed: false });
    expect(state?.code).toBe('application_rejected');
    expect(state?.message).toMatch(/apply again/);
  });

  it('says nothing special once approved', () => {
    expect(applicantLoginState({ status: 'approved', emailUnconfirmed: false })).toBeNull();
  });
});
