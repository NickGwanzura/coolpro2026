import { pgTable, pgEnum, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './users';

export const inviteStatusEnum = pgEnum('invite_status', [
  'pending',
  'accepted',
  'revoked',
  'expired',
]);

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  role: userRoleEnum('role').notNull(),
  region: text('region').notNull(),
  token: text('token').notNull().unique(),
  status: inviteStatusEnum('status').notNull().default('pending'),
  invitedBy: text('invited_by').notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
