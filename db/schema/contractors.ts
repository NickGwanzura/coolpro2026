import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const contractorApplicationStatusEnum = pgEnum('contractor_application_status', [
  'invited',
  'submitted',
  'under-review',
  'approved',
  'rejected',
]);

// Contractor is an invitation-only role, mirroring the supplier invite pattern: an admin
// invites by email, the invitee sets their own password via /accept-invite, then completes
// this onboarding questionnaire themselves at /contractor-onboarding.
export const contractorApplications = pgTable('contractor_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  companyName: text('company_name'),
  contactName: text('contact_name'),
  phone: text('phone'),
  region: text('region').notNull(),
  tradeSpecialization: text('trade_specialization'),
  yearsInOperation: text('years_in_operation'),
  teamSize: text('team_size'),
  servicesOffered: jsonb('services_offered').$type<string[]>().default([]),
  hasSafetyCertification: text('has_safety_certification'),
  biggestChallenge: text('biggest_challenge'),
  invitedBy: text('invited_by').notNull(),
  status: contractorApplicationStatusEnum('status').notNull().default('invited'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: text('reviewed_by'),
  reviewNote: text('review_note'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
