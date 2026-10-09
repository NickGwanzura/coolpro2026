import { describe, expect, it } from 'vitest';
import { validateRegistrationApplication } from './registration-validation';

const base = {
  role: 'trainer',
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
    const result = validateRegistrationApplication(base);
    expect(result).toMatchObject({
      ok: true,
      value: { role: 'trainer', firstName: 'Tendai', email: 'tendai@example.com', organisation: 'Harare Polytechnic', details: null },
    });
  });

  it('accepts a lecturer', () => {
    expect(validateRegistrationApplication({ ...base, role: 'lecturer' }).ok).toBe(true);
  });

  it('accepts a contractor and drops unknown services', () => {
    const result = validateRegistrationApplication(contractor);
    expect(result.ok).toBe(true);
    expect(result.ok && result.value.details).toMatchObject({
      tradeSpecialization: 'Installation',
      servicesOffered: ['Retrofit', 'Maintenance & Servicing'],
    });
  });

  it('never accepts an administrator or other unlisted role', () => {
    for (const role of ['org_admin', 'vendor', 'student', 'technician', '', undefined]) {
      expect(validateRegistrationApplication({ ...base, role }).ok).toBe(false);
    }
  });

  it('requires the basics', () => {
    for (const field of ['firstName', 'lastName', 'email', 'phone', 'region', 'organisation']) {
      expect(validateRegistrationApplication({ ...base, [field]: '' }).ok).toBe(false);
    }
    expect(validateRegistrationApplication({ ...base, email: 'not-an-email' }).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, phone: '123' }).ok).toBe(false);
  });

  it('enforces password strength and a meaningful summary', () => {
    expect(validateRegistrationApplication({ ...base, password: 'short' }).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, password: 'x'.repeat(73) }).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, experienceSummary: 'too short' }).ok).toBe(false);
    expect(validateRegistrationApplication({ ...base, experienceSummary: 'x'.repeat(3001) }).ok).toBe(false);
  });

  it('requires the contractor questions', () => {
    for (const field of ['tradeSpecialization', 'yearsInOperation', 'teamSize', 'hasSafetyCertification']) {
      const details = { ...contractor.details, [field]: 'not an option' };
      expect(validateRegistrationApplication({ ...contractor, details }).ok).toBe(false);
    }
    expect(validateRegistrationApplication({ ...contractor, details: undefined }).ok).toBe(false);
  });

  it('rejects submissions that fill the hidden honeypot field', () => {
    expect(validateRegistrationApplication({ ...base, website: 'http://spam.example' }).ok).toBe(false);
  });

  it('handles junk bodies without throwing', () => {
    expect(validateRegistrationApplication(null).ok).toBe(false);
    expect(validateRegistrationApplication('x').ok).toBe(false);
  });
});
