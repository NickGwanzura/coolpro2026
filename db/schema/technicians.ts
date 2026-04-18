import { pgTable, pgEnum, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const technicianStatusEnum = pgEnum('technician_status', [
  'active',
  'inactive',
  'suspended',
  'pending',
]);

export const employmentStatusEnum = pgEnum('employment_status', [
  'employed',
  'self-employed',
  'unemployed',
]);

export const certificationStatusEnum = pgEnum('certification_status', [
  'valid',
  'expired',
  'pending',
]);

// Matches Technician interface from types/index.ts
export const technicians = pgTable('technicians', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nationalId: text('national_id').notNull(),
  registrationNumber: text('registration_number').notNull().unique(),
  region: text('region').notNull(),
  province: text('province').notNull(),
  district: text('district').notNull(),
  contactNumber: text('contact_number').notNull(),
  email: text('email'),
  specialization: text('specialization').notNull(),
  // Certification[] stored as JSONB
  certifications: jsonb('certifications').notNull().default([]),
  // TrainingRecord[] stored as JSONB
  trainingHistory: jsonb('training_history').notNull().default([]),
  employmentStatus: employmentStatusEnum('employment_status').notNull().default('employed'),
  employer: text('employer'),
  // string[] stored as JSONB
  refrigerantsHandled: jsonb('refrigerants_handled').notNull().default([]),
  supplierId: uuid('supplier_id'),
  registrationDate: text('registration_date').notNull(),
  expiryDate: text('expiry_date').notNull(),
  status: technicianStatusEnum('status').notNull().default('active'),
  lastRenewalDate: text('last_renewal_date'),
  nextRenewalDate: text('next_renewal_date'),
  qrToken: text('qr_token'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
