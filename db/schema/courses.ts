import { pgTable, pgEnum, uuid, text, integer, boolean, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const courseStatusEnum = pgEnum('course_status', [
  'draft',
  'pending_nou',
  'approved',
  'rejected',
]);

export const examSubmissionStatusEnum = pgEnum('exam_submission_status', [
  'pending',
  'graded',
]);

// Matches ManagedCourse interface
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  lecturerId: uuid('lecturer_id').notNull(),
  lecturerName: text('lecturer_name').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  // CourseModule[] stored as JSONB: [{title, content, minutes}]
  modules: jsonb('modules').notNull().default([]),
  status: courseStatusEnum('status').notNull().default('draft'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Matches ExamSubmission interface
export const examSubmissions = pgTable('exam_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  courseTitle: text('course_title').notNull(),
  studentId: uuid('student_id').notNull(),
  studentName: text('student_name').notNull(),
  // ExamAnswer[] stored as JSONB: [{question, answer}]
  answers: jsonb('answers').notNull().default([]),
  score: numeric('score', { precision: 5, scale: 2 }),
  passed: boolean('passed'),
  feedback: text('feedback'),
  status: examSubmissionStatusEnum('status').notNull().default('pending'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  gradedAt: timestamp('graded_at', { withTimezone: true }),
});
