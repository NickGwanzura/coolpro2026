import { describe, expect, it } from 'vitest';
import {
  collectAttachments,
  courseReferencesMaterial,
  findAttachment,
  isAllowedCourseMaterialType,
  MAX_MATERIAL_SIZE_BYTES,
  validateCourseBasics,
  validateCourseModules,
} from './course-validation';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';

function attachment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    fileName: 'notes.pdf',
    fileType: 'application/pdf',
    sizeBytes: 1024,
    r2Key: `courses/${COURSE_ID}/abc-notes.pdf`,
    uploadedAt: '2026-10-09T00:00:00.000Z',
    ...overrides,
  };
}

function modules(attachments?: unknown) {
  return [{ title: 'Intro', content: 'Welcome', minutes: 30, attachments }];
}

describe('validateCourseModules', () => {
  it('accepts modules without attachments, with or without a course id', () => {
    expect(validateCourseModules(modules()).modules).toHaveLength(1);
    expect(validateCourseModules(modules(), COURSE_ID).modules).toHaveLength(1);
  });

  it('keeps a valid attachment stored under the course prefix', () => {
    const result = validateCourseModules(modules([attachment()]), COURSE_ID);
    expect(result.error).toBeUndefined();
    expect(result.modules?.[0].attachments).toHaveLength(1);
  });

  it('rejects attachments on a course that has no id yet', () => {
    expect(validateCourseModules(modules([attachment()])).error).toMatch(/attachment/);
  });

  it('rejects an attachment stored under another course or area', () => {
    const other = attachment({ r2Key: 'courses/22222222-2222-4222-8222-222222222222/x.pdf' });
    expect(validateCourseModules(modules([other]), COURSE_ID).error).toMatch(/attachment/);
    const photo = attachment({ r2Key: 'technician-photos/abc/x.png' });
    expect(validateCourseModules(modules([photo]), COURSE_ID).error).toMatch(/attachment/);
  });

  it('rejects unsupported types, oversized and non-integer sizes', () => {
    expect(validateCourseModules(modules([attachment({ fileType: 'text/html' })]), COURSE_ID).error).toBeDefined();
    expect(validateCourseModules(modules([attachment({ sizeBytes: MAX_MATERIAL_SIZE_BYTES + 1 })]), COURSE_ID).error).toBeDefined();
    expect(validateCourseModules(modules([attachment({ sizeBytes: 10.5 })]), COURSE_ID).error).toBeDefined();
    expect(validateCourseModules(modules([attachment({ sizeBytes: 0 })]), COURSE_ID).error).toBeDefined();
  });

  it('keeps the existing module rules', () => {
    expect(validateCourseModules([]).error).toBeDefined();
    expect(validateCourseModules([{ title: '', content: 'x', minutes: 5 }]).error).toBeDefined();
    expect(validateCourseModules([{ title: 'T', content: 'x', minutes: 481 }]).error).toBeDefined();
  });
});

describe('attachment lookup helpers', () => {
  const saved = modules([attachment()]);

  it('finds attachments across modules', () => {
    expect(collectAttachments(saved)).toHaveLength(1);
    expect(collectAttachments('nope')).toEqual([]);
    expect(findAttachment(saved, `courses/${COURSE_ID}/abc-notes.pdf`)?.fileName).toBe('notes.pdf');
    expect(findAttachment(saved, 'courses/other/x.pdf')).toBeUndefined();
  });

  it('reports whether a course references a key', () => {
    expect(courseReferencesMaterial(saved, `courses/${COURSE_ID}/abc-notes.pdf`)).toBe(true);
    expect(courseReferencesMaterial(saved, 'nope')).toBe(false);
  });
});

describe('isAllowedCourseMaterialType', () => {
  it('allows documents and media but not scripts or markup', () => {
    expect(isAllowedCourseMaterialType('application/pdf')).toBe(true);
    expect(isAllowedCourseMaterialType('video/mp4')).toBe(true);
    expect(isAllowedCourseMaterialType('text/html')).toBe(false);
    expect(isAllowedCourseMaterialType('image/svg+xml')).toBe(false);
  });
});

describe('validateCourseBasics', () => {
  const base = { title: 'Refrigerant safety', description: 'Overview' };

  it('leaves pass mark and CPD credits unset when omitted', () => {
    expect(validateCourseBasics(base)).toMatchObject({ title: 'Refrigerant safety', passMark: undefined, cpdCredits: undefined });
  });

  it('accepts whole numbers in range, including numeric strings', () => {
    expect(validateCourseBasics({ ...base, passMark: 75, cpdCredits: '8' })).toMatchObject({ passMark: 75, cpdCredits: 8 });
    expect(validateCourseBasics({ ...base, passMark: 1, cpdCredits: 0 })).toMatchObject({ passMark: 1, cpdCredits: 0 });
  });

  it('rejects out-of-range or non-integer values', () => {
    expect(validateCourseBasics({ ...base, passMark: 0 }).error).toMatch(/Pass mark/);
    expect(validateCourseBasics({ ...base, passMark: 101 }).error).toMatch(/Pass mark/);
    expect(validateCourseBasics({ ...base, passMark: 70.5 }).error).toMatch(/Pass mark/);
    expect(validateCourseBasics({ ...base, cpdCredits: -1 }).error).toMatch(/CPD/);
    expect(validateCourseBasics({ ...base, cpdCredits: 'lots' }).error).toMatch(/CPD/);
  });
});
