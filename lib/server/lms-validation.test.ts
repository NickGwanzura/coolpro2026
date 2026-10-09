import { describe, expect, it } from 'vitest';
import { validateCertificateRequest, validateExamAnswers, validateGrade, MAX_EXAM_ANSWERS, DEFAULT_PASS_MARK } from './lms-validation';

describe('validateGrade', () => {
  it('accepts a valid grade and trims feedback', () => {
    const result = validateGrade({ score: 82.456, passed: true, feedback: '  Well done  ' });
    expect(result).toEqual({ ok: true, value: { score: 82.46, passed: true, feedback: 'Well done' } });
  });

  it.each([-1, 101, 9999, Number.NaN, '80', null])('rejects score %s', (score) => {
    expect(validateGrade({ score, passed: true, feedback: '' }).ok).toBe(false);
  });

  it('works out pass or fail from the pass mark when none is sent', () => {
    expect(validateGrade({ score: 70 }, 70)).toMatchObject({ ok: true, value: { passed: true } });
    expect(validateGrade({ score: 69.99 }, 70)).toMatchObject({ ok: true, value: { passed: false } });
    expect(validateGrade({ score: 55 }, 50)).toMatchObject({ ok: true, value: { passed: true } });
    expect(validateGrade({ score: DEFAULT_PASS_MARK })).toMatchObject({ ok: true, value: { passed: true } });
  });

  it('rejects a pass or fail that contradicts the pass mark', () => {
    const tooLow = validateGrade({ score: 40, passed: true }, 70);
    expect(tooLow.ok).toBe(false);
    expect(tooLow.ok === false && tooLow.error).toMatch(/below the pass mark of 70/);
    const tooHigh = validateGrade({ score: 90, passed: false }, 70);
    expect(tooHigh.ok).toBe(false);
    expect(validateGrade({ score: 90, passed: true }, 70).ok).toBe(true);
    expect(validateGrade({ score: 50, passed: 'yes' }, 70).ok).toBe(false);
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
        examSubmissionId: null,
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

  it('accepts a request linked to a graded exam without course, date or theory score', () => {
    const examId = '22222222-2222-4222-8222-222222222222';
    const result = validateCertificateRequest(
      { technicianId: valid.technicianId, technicianRegistrationNumber: 'TEC-1', examSubmissionId: examId, practicalScore: 90 },
      today,
    );
    expect(result).toMatchObject({ ok: true, value: { examSubmissionId: examId, theoryScore: null, practicalScore: 90 } });
  });

  it('still requires a practical score and a valid id when linked', () => {
    const base = { technicianId: valid.technicianId, technicianRegistrationNumber: 'TEC-1' };
    expect(validateCertificateRequest({ ...base, examSubmissionId: 'not-a-uuid', practicalScore: 90 }, today).ok).toBe(false);
    expect(validateCertificateRequest({ ...base, examSubmissionId: '22222222-2222-4222-8222-222222222222' }, today).ok).toBe(false);
  });

  it('keeps a manual request unlinked', () => {
    expect(validateCertificateRequest(valid, today)).toMatchObject({ ok: true, value: { examSubmissionId: null } });
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
