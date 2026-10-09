import { pgEnum, pgTable, text, timestamp, uuid, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const registrationApplicantRoleEnum = pgEnum('registration_applicant_role', [
  'trainer',
  'lecturer',
  'contractor',
]);

export const registrationApplicationStatusEnum = pgEnum('registration_application_status', [
  'submitted',
  'under-review',
  'approved',
  'rejected',
]);

// Public self-registration for the roles that have no dedicated application table of their own
// (trainer, lecturer, contractor). Technician, student and supplier keep their own tables because
// they carry role-specific fields. On approval a `users` row is provisioned for the role.
export const registrationApplications = pgTable('registration_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  role: registrationApplicantRoleEnum('role').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  phone: text('phone').notNull(),
  region: text('region').notNull(),
  organisation: text('organisation'),
  // Free-text summary of qualifications / experience the reviewer should look at.
  experienceSummary: text('experience_summary').notNull(),
  // Role-specific answers (for example a contractor's trade, team size and services offered).
  details: jsonb('details'),
  idDocumentName: text('id_document_name'),
  status: registrationApplicationStatusEnum('status').notNull().default('submitted'),
  // Internal-only notes. Never shown to the applicant.
  reviewNote: text('review_note'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('registration_applications_email_idx').on(table.email),
]);

// One row per confirmation link sent to a self-registering applicant. Only a hash of the token is
// stored. An application with an unverified row here cannot be approved; applications created by
// an admin have no row and are treated as verified.
export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('email_verifications_token_hash_idx').on(table.tokenHash),
  index('email_verifications_entity_idx').on(table.entityType, table.entityId),
]);
