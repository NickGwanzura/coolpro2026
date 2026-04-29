import { pgEnum, pgTable, text, timestamp, integer, uuid, jsonb } from 'drizzle-orm/pg-core';

export const studentApplicationStatusEnum = pgEnum('student_application_status', [
  'submitted',
  'under-review',
  'approved',
  'rejected',
]);

export const technicianApplicationStatusEnum = pgEnum('technician_application_status', [
  'submitted',
  'under-review',
  'approved',
  'rejected',
]);

export const studentApplications = pgTable('student_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  polytech: text('polytech').notNull(),
  fieldOfStudy: text('field_of_study').notNull(),
  studentIdNumber: text('student_id_number').notNull(),
  enrolmentYear: integer('enrolment_year').notNull(),
  idDocumentName: text('id_document_name'),
  status: studentApplicationStatusEnum('status').notNull().default('submitted'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: text('reviewed_by'),
  reviewNote: text('review_note'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const technicianApplications = pgTable('technician_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nationalId: text('national_id').notNull(),
  registrationNumber: text('registration_number').notNull(),
  email: text('email').notNull(),
  contactNumber: text('contact_number').notNull(),
  province: text('province').notNull(),
  district: text('district').notNull(),
  region: text('region').notNull(),
  specialization: text('specialization').notNull(),
  employmentStatus: text('employment_status').notNull().default('employed'),
  employer: text('employer'),
  yearsExperience: integer('years_experience').notNull().default(0),
  certifications: jsonb('certifications').notNull().default([]),
  refrigerantsHandled: jsonb('refrigerants_handled').notNull().default([]),
  status: technicianApplicationStatusEnum('status').notNull().default('submitted'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: text('reviewed_by'),
  reviewNote: text('review_note'),
  approvedTechnicianId: uuid('approved_technician_id'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
