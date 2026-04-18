import { pgTable, pgEnum, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'technician',
  'trainer',
  'lecturer',
  'vendor',
  'org_admin',
  'regulator',
]);

export const userStatusEnum = pgEnum('user_status', [
  'active',
  'inactive',
  'suspended',
  'pending',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: userRoleEnum('role').notNull(),
  region: text('region').notNull(),
  registrationNo: text('registration_no'),
  qrToken: text('qr_token'),
  status: userStatusEnum('status').notNull().default('active'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
