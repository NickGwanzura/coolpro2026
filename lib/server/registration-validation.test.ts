import { describe, expect, it } from 'vitest';
import { validateRegistrationApplication } from './registration-validation';

const NOW = Date.parse('2026-10-10T08:00:00Z');
const base = {
  role: 'trainer',
  formStartedAt: NOW - 60_000,
  firstName: ' Tendai ',
  lastName: 'Moyo',
  email: ' Tendai@Example.com ',
  password: 'a-long-enough-password',
  phone: '+263 77 100 0001',
  region: 'Harare',
  organisation: 'Harare Polytechnic',
  experienceSummary: 'Ten years assessing refrigeration trainees for the national trade test.',
};

const contractor = {
  ...base,
  role: 'contractor',
  organisation: 'CoolWorks (Pvt) Ltd',
  experienceSummary: 'We install and service commercial cold rooms across Mashonaland.',
  details: {
    tradeSpecialization: 'Installation',
    yearsInOperation: '4-10 years',
    teamSize: '6-20',
    hasSafetyCertification: 'In progress',
    servicesOffered: ['Retrofit', 'Maintenance & Servicing', 'Made Up Service'],
  },
};

describe('validateRegistrationApplication', () => {
  it('accepts a trainer and cleans up the values', () => {
    const result = validateRegistrationApplication(base, NOW);
    expect(result).toMatchObject({
      ok: true,
      value: { role: 'trainer', firstName: 'Tendai', email: 'tendai@example.com', organisation: 'Harare Polytechnic', details: null },
    });
  });

  it('accepts a lecturer', () => {
    expect(validateRegistrationApplication({ ...base, role: 'lecturer' }, NOW).ok).toBe(true);
  });

  it('accepts a contractor and drops unknown services', () => {
    const result = validateRegistrationApplication(contractor, NOW);
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.details).toMatchObject({
      tradeSpecialization: 'Installation',
      servicesOffered: ['Retrofit', 'Maintenance & Servicing'],
    });
  });

  it('never accepts an administrator or other unlisted role', () => {
    for (const role of ['org_admin', 'vendor', 'student', 'technician', '', undefined]) {
      expect(validateRegistrationApplication({ ...base, role }, NOW).ok).toBe(false);
    }
  });

  it('requires the basics', () => {
    for (const field of ['firstName', 'lastName', 'email', 'phone', 'region', 'organisation']) {
      expect(validateRegistrationApplication({ ...base, [field]: '' }, NOW).ok).toBe(false);
    }
    expect(validateRegistrationApplication({ ...base, email: 'not-an-email' }, NOW).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, phone: '123' }, NOW).ok).toBe(false);
  });

  it('enforces password strength and a meaningful summary', () => {
    expect(validateRegistrationApplication({ ...base, password: 'short' }, NOW).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, password: 'x'.repeat(73) }, NOW).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, experienceSummary: 'too short' }, NOW).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, experienceSummary: 'x'.repeat(3001) }, NOW).ok).toBe(false);
  });

  it('requires the contractor questions', () => {
    for (const field of ['tradeSpecialization', 'yearsInOperation', 'teamSize', 'hasSafetyCertification']) {
      const details = { ...contractor.details, [field]: 'not an option' };
      expect(validateRegistrationApplication({ ...contractor, details }, NOW).ok).toBe(false);
    }
    expect(validateRegistrationApplication({ ...contractor, details: undefined }, NOW).ok).toBe(false);
  });

  it('rejects submissions that fill the hidden honeypot field', () => {
    expect(validateRegistrationApplication({ ...base, website: 'http://spam.example' }, NOW).ok).toBe(false);
  });

  it('rejects a form submitted too quickly, or with no start time', () => {
    expect(validateRegistrationApplication({ ...base, formStartedAt: NOW - 500 }, NOW).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, formStartedAt: undefined }, NOW).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, formStartedAt: 'yesterday' }, NOW).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, formStartedAt: NOW + 60_000 }, NOW).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, formStartedAt: NOW - 5_000 }, NOW).ok).toBe(true);
  });

  it('handles junk bodies without throwing', () => {
    expect(validateRegistrationApplication(null, NOW).ok).toBe(false);
    expect(validateRegistrationApplication('x', NOW).ok).toBe(false);
  });
});
