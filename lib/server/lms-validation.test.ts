import { describe, expect, it } from 'vitest';
import { validateCertificateRequest, validateExamAnswers, validateGrade, MAX_EXAM_ANSWERS } from './lms-validation';

describe('validateGrade', () => {
  it('accepts a valid grade and trims feedback', () => {
    const result = validateGrade({ score: 82.456, passed: true, feedback: '  Well done  ' });
    expect(result).toEqual({ ok: true, value: { score: 82.46, passed: true, feedback: 'Well done' } });
  });

  it.each([-1, 101, 9999, Number.NaN, '80', null])('rejects score %s', (score) => {
    expect(validateGrade({ score, passed: true, feedback: '' }).ok).toBe(false);
  });

  it('requires an explicit pass or fail', () => {
    expect(validateGrade({ score: 50, feedback: '' }).ok).toBe(false);
    expect(validateGrade({ score: 50, passed: 'yes' }).ok).toBe(false);
  });

  it('rejects overlong feedback and non-object bodies', () => {
    expect(validateGrade({ score: 50, passed: false, feedback: 'x'.repeat(2001) }).ok).toBe(false);
    expect(validateGrade(null).ok).toBe(false);
    expect(validateGrade('nope').ok).toBe(false);
  });
});

describe('validateExamAnswers', () => {
  it('accepts and trims answers', () => {
    const result = validateExamAnswers([{ question: ' Q1 ', answer: ' A1 ' }]);
    expect(result).toEqual({ ok: true, value: [{ question: 'Q1', answer: 'A1' }] });
  });

  it('rejects empty, oversized and malformed input', () => {
    expect(validateExamAnswers([]).ok).toBe(false);
    expect(validateExamAnswers('x').ok).toBe(false);
    expect(validateExamAnswers([{ question: 'Q', answer: '' }]).ok).toBe(false);
    expect(validateExamAnswers([{ question: '', answer: 'A' }]).ok).toBe(false);
    expect(validateExamAnswers([{ question: 'Q', answer: 'x'.repeat(10_001) }]).ok).toBe(false);
    const tooMany = Array.from({ length: MAX_EXAM_ANSWERS + 1 }, () => ({ question: 'Q', answer: 'A' }));
    expect(validateExamAnswers(tooMany).ok).toBe(false);
  });
});

describe('validateCertificateRequest', () => {
  const today = new Date('2026-10-09T10:00:00Z');
  const valid = {
    technicianId: '00000000-0000-4000-8001-000000000001',
    technicianRegistrationNumber: ' tec-2024-001 ',
    courseTitle: 'RAC Refrigerant Safety',
    examDate: '2026-10-01',
    theoryScore: 78,
    practicalScore: '85',
    notes: '',
  };

  it('accepts a valid request and normalises it', () => {
    const result = validateCertificateRequest(valid, today);
    expect(result).toEqual({
      ok: true,
      value: {
        technicianId: valid.technicianId,
        technicianRegistrationNumber: 'TEC-2024-001',
        courseTitle: 'RAC Refrigerant Safety',
        examDate: '2026-10-01',
        theoryScore: 78,
        practicalScore: 85,
        notes: null,
      },
    });
  });

  it('allows an exam dated today', () => {
    expect(validateCertificateRequest({ ...valid, examDate: '2026-10-09' }, today).ok).toBe(true);
  });

  it('rejects a bad technician id, future or invalid dates', () => {
    expect(validateCertificateRequest({ ...valid, technicianId: 'abc' }, today).ok).toBe(false);
    expect(validateCertificateRequest({ ...valid, examDate: '2026-10-10' }, today).ok).toBe(false);
    expect(validateCertificateRequest({ ...valid, examDate: '2026-02-30' }, today).ok).toBe(false);
    expect(validateCertificateRequest({ ...valid, examDate: 'yesterday' }, today).ok).toBe(false);
  });

  it.each([-5, 101, 'abc', '', null])('rejects score %s', (score) => {
    expect(validateCertificateRequest({ ...valid, theoryScore: score }, today).ok).toBe(false);
    expect(validateCertificateRequest({ ...valid, practicalScore: score }, today).ok).toBe(false);
  });

  it('rejects missing fields and overlong text', () => {
    expect(validateCertificateRequest({ ...valid, courseTitle: ' ' }, today).ok).toBe(false);
    expect(validateCertificateRequest({ ...valid, technicianRegistrationNumber: '' }, today).ok).toBe(false);
    expect(validateCertificateRequest({ ...valid, notes: 'x'.repeat(2001) }, today).ok).toBe(false);
    expect(validateCertificateRequest(undefined, today).ok).toBe(false);
  });
});
