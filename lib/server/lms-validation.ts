// Pure input validation for the exam, grading and certificate flows. No database access, so it
// can be unit tested directly.

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const MAX_EXAM_ANSWERS = 100;
const MAX_QUESTION_LENGTH = 1000;
const MAX_ANSWER_LENGTH = 10_000;
const MAX_FEEDBACK_LENGTH = 2000;
const MAX_COURSE_TITLE_LENGTH = 180;
const MAX_NOTES_LENGTH = 2000;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export interface GradeInput {
  score: number;
  passed: boolean;
  feedback: string;
}

export function validateGrade(body: unknown): Validated<GradeInput> {
  const raw = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const score = typeof raw.score === 'number' ? raw.score : Number.NaN;
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return { ok: false, error: 'Score must be a number between 0 and 100.' };
  }
  if (typeof raw.passed !== 'boolean') {
    return { ok: false, error: 'Pass or fail must be chosen.' };
  }
  const feedback = text(raw.feedback);
  if (feedback.length > MAX_FEEDBACK_LENGTH) {
    return { ok: false, error: `Feedback must be ${MAX_FEEDBACK_LENGTH} characters or fewer.` };
  }
  return { ok: true, value: { score: Math.round(score * 100) / 100, passed: raw.passed, feedback } };
}

export interface ExamAnswerInput {
  question: string;
  answer: string;
}

export function validateExamAnswers(value: unknown): Validated<ExamAnswerInput[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, error: 'Answer at least one question before submitting.' };
  }
  if (value.length > MAX_EXAM_ANSWERS) {
    return { ok: false, error: `An exam can have at most ${MAX_EXAM_ANSWERS} answers.` };
  }
  const answers: ExamAnswerInput[] = [];
  for (const [index, raw] of value.entries()) {
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const question = text(item.question);
    const answer = text(item.answer);
    if (!question) return { ok: false, error: `Answer ${index + 1} is missing its question.` };
    if (!answer) return { ok: false, error: `Answer ${index + 1} is empty.` };
    if (question.length > MAX_QUESTION_LENGTH) return { ok: false, error: `Question ${index + 1} is too long.` };
    if (answer.length > MAX_ANSWER_LENGTH) return { ok: false, error: `Answer ${index + 1} is too long.` };
    answers.push({ question, answer });
  }
  return { ok: true, value: answers };
}

export interface CertificateRequestInput {
  technicianId: string;
  technicianRegistrationNumber: string;
  courseTitle: string;
  examDate: string;
  theoryScore: number;
  practicalScore: number;
  notes: string | null;
}

function validScore(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : Number.NaN;
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Math.round(n);
}

/** today is injectable so tests do not depend on the clock. */
export function validateCertificateRequest(body: unknown, today: Date = new Date()): Validated<CertificateRequestInput> {
  const raw = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

  const technicianId = text(raw.technicianId);
  if (!UUID_PATTERN.test(technicianId)) return { ok: false, error: 'Choose a registered technician.' };

  const technicianRegistrationNumber = text(raw.technicianRegistrationNumber).toUpperCase();
  if (!technicianRegistrationNumber) return { ok: false, error: 'technicianRegistrationNumber is required' };

  const courseTitle = text(raw.courseTitle);
  if (!courseTitle) return { ok: false, error: 'courseTitle is required' };
  if (courseTitle.length > MAX_COURSE_TITLE_LENGTH) return { ok: false, error: `Course title must be ${MAX_COURSE_TITLE_LENGTH} characters or fewer.` };

  const examDate = text(raw.examDate);
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(examDate) ? new Date(`${examDate}T00:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== examDate) {
    return { ok: false, error: 'Exam date must be a valid date (YYYY-MM-DD).' };
  }
  const endOfToday = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59);
  if (parsed.getTime() > endOfToday) return { ok: false, error: 'Exam date cannot be in the future.' };

  const theoryScore = validScore(raw.theoryScore);
  const practicalScore = validScore(raw.practicalScore);
  if (theoryScore === null || practicalScore === null) {
    return { ok: false, error: 'Theory and practical scores must be numbers between 0 and 100.' };
  }

  const notes = text(raw.notes);
  if (notes.length > MAX_NOTES_LENGTH) return { ok: false, error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.` };

  return {
    ok: true,
    value: {
      technicianId,
      technicianRegistrationNumber,
      courseTitle,
      examDate,
      theoryScore,
      practicalScore,
      notes: notes || null,
    },
  };
}
