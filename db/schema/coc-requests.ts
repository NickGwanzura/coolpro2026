import { pgEnum, pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';

export const cocRequestStatusEnum = pgEnum('coc_request_status', [
  'submitted',
  'approved',
  'rejected',
]);

// Certificate of Conformity requests — a technician submits one per completed installation
// job; an org_admin (National Admin) reviews and, on approval, the request becomes a
// verifiable issued certificate (same PDF+QR pattern as trade permits).
export const cocRequests = pgTable('coc_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  certificateNumber: text('certificate_number').notNull().unique(),
  plannerJobId: uuid('planner_job_id'),
  technicianId: uuid('technician_id').notNull(),
  technicianName: text('technician_name').notNull(),
  clientName: text('client_name').notNull(),
  location: text('location').notNull(),
  equipmentType: text('equipment_type').notNull(),
  serialNumber: text('serial_number'),
  installationDate: text('installation_date').notNull(),
  details: text('details'),
  complianceCheck: boolean('compliance_check').notNull().default(false),
  status: cocRequestStatusEnum('status').notNull().default('submitted'),
  verificationToken: text('verification_token'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewNote: text('review_note'),
  issuedDate: text('issued_date'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
