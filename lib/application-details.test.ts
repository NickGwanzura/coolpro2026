import { describe, expect, it } from 'vitest';
import { professionalDetails, studentDetails, supplierDetails, technicianDetails } from './application-details';

describe('application detail rows', () => {
  it('summarises a technician and skips empty values', () => {
    const rows = technicianDetails({
      contactNumber: '+263771000001',
      province: 'Harare',
      district: '',
      specialization: 'Commercial Refrigeration',
      employmentStatus: 'self-employed',
      employer: null,
      yearsExperience: 6,
      registrationNumber: 'TEC-2026-001',
    });
    expect(rows).toContainEqual({ label: 'Location', value: 'Harare' });
    expect(rows).toContainEqual({ label: 'Employment', value: 'self-employed' });
    expect(rows).toContainEqual({ label: 'Experience', value: '6 years' });
  });

  it('includes the employer when there is one', () => {
    const rows = technicianDetails({
      contactNumber: '1', province: 'Harare', district: 'Harare Central', specialization: 'RAC',
      employmentStatus: 'employed', employer: 'CoolTech', yearsExperience: 2, registrationNumber: 'T-1',
    });
    expect(rows).toContainEqual({ label: 'Employment', value: 'employed at CoolTech' });
    expect(rows).toContainEqual({ label: 'Location', value: 'Harare Central, Harare' });
  });

  it('summarises a student', () => {
    const rows = studentDetails({ phone: '077', polytech: 'Harare Polytechnic', fieldOfStudy: 'Refrigeration', studentIdNumber: 'HP-1', enrolmentYear: 2025 });
    expect(rows.map((row) => row.label)).toEqual(['Phone', 'Institution', 'Field of study', 'Student ID', 'Enrolment year']);
  });

  it('summarises a supplier', () => {
    const rows = supplierDetails({ companyName: 'ColdGas', phone: '024', province: 'Bulawayo', city: 'Bulawayo', supplierType: 'distributor', registrationNumber: 'SUP-1' });
    expect(rows).toContainEqual({ label: 'Company', value: 'ColdGas' });
  });

  it('summarises a contractor with trade details and a trimmed summary', () => {
    const rows = professionalDetails({
      role: 'contractor', phone: '077', region: 'Mashonaland East', organisation: 'CoolWorks',
      experienceSummary: 'x'.repeat(500),
      details: { tradeSpecialization: 'Installation', teamSize: '6-20', yearsInOperation: '4-10 years', hasSafetyCertification: 'Yes' },
    });
    expect(rows[0]).toEqual({ label: 'Company', value: 'CoolWorks' });
    expect(rows).toContainEqual({ label: 'Main trade', value: 'Installation' });
    const summary = rows.find((row) => row.label === 'About them');
    expect(summary?.value.length).toBeLessThanOrEqual(280);
    expect(summary?.value.endsWith('…')).toBe(true);
  });

  it('uses "Institution" for trainers and lecturers and no contractor fields', () => {
    const rows = professionalDetails({ role: 'trainer', phone: '077', region: 'Harare', organisation: 'HIT', experienceSummary: 'Assessor for ten years.', details: null });
    expect(rows[0]).toEqual({ label: 'Institution', value: 'HIT' });
    expect(rows.map((row) => row.label)).not.toContain('Main trade');
  });
});
