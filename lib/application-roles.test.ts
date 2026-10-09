import { describe, expect, it } from 'vitest';
import {
  accountRoleFor,
  APPLICANT_ROLES,
  isApplicantRole,
  isRegistrationApplicationRole,
  REGISTRATION_APPLICATION_ROLES,
} from './application-roles';

describe('application roles', () => {
  it('describes every role with next steps and a review time', () => {
    for (const info of Object.values(APPLICANT_ROLES)) {
      expect(info.label).not.toBe('');
      expect(info.afterApproval.length).toBeGreaterThanOrEqual(2);
      expect(info.reviewTime).not.toBe('');
    }
  });

  it('recognises valid roles and rejects look-alikes', () => {
    expect(isApplicantRole('trainer')).toBe(true);
    expect(isApplicantRole('org_admin')).toBe(false);
    expect(isApplicantRole('vendor')).toBe(false);
    expect(isApplicantRole('toString')).toBe(false);
    expect(isApplicantRole(undefined)).toBe(false);
  });

  it('never lets anyone register as an administrator', () => {
    expect(Object.keys(APPLICANT_ROLES)).not.toContain('org_admin');
    expect(REGISTRATION_APPLICATION_ROLES).not.toContain('org_admin');
    expect(isRegistrationApplicationRole('org_admin')).toBe(false);
  });

  it('uses the generic table only for trainer, lecturer and contractor', () => {
    for (const role of ['trainer', 'lecturer', 'contractor']) expect(isRegistrationApplicationRole(role)).toBe(true);
    for (const role of ['student', 'technician', 'supplier']) expect(isRegistrationApplicationRole(role)).toBe(false);
  });

  it('maps supplier to the vendor account role', () => {
    expect(accountRoleFor('supplier')).toBe('vendor');
    expect(accountRoleFor('student')).toBe('student');
  });
});
