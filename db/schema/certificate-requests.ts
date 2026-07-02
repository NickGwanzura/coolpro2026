import { pgEnum, pgTable, text, timestamp, integer, uuid } from 'drizzle-orm/pg-core';

export const trainerCertificateStatusEnum = pgEnum('trainer_certificate_status', [
  'draft',
  'submitted-for-admin-approval',
  'admin-approved',
  'rejected',
  'issued',
]);

export const trainerCertificateRequests = pgTable('trainer_certificate_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  technicianId: uuid('technician_id').notNull(),
  technicianName: text('technician_name').notNull(),
  technicianRegistrationNumber: text('technician_registration_number').notNull(),
  technicianCompany: text('technician_company').notNull(),
  trainerName: text('trainer_name').notNull(),
  trainerEmail: text('trainer_email').notNull(),
  courseTitle: text('course_title').notNull(),
  examDate: text('exam_date').notNull(),
  theoryScore: integer('theory_score').notNull(),
  practicalScore: integer('practical_score').notNull(),
  overallScore: integer('overall_score').notNull(),
  notes: text('notes'),
  status: trainerCertificateStatusEnum('status').notNull().default('submitted-for-admin-approval'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  adminReviewer: text('admin_reviewer'),
  certificateNumber: text('certificate_number'),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  verificationToken: text('verification_token'),
  cpdCredits: integer('cpd_credits'),
});
