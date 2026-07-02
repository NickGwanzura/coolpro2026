import { pgEnum, pgTable, text, timestamp, integer, numeric, uuid } from 'drizzle-orm/pg-core';

export const trainingSessionStatusEnum = pgEnum('training_session_status', [
  'scheduled',
  'open',
  'completed',
  'full',
]);

export const trainingSessions = pgTable('training_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  venue: text('venue').notNull(),
  province: text('province').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  feeUsd: numeric('fee_usd', { precision: 10, scale: 2 }).notNull(),
  seats: integer('seats').notNull(),
  seatsRemaining: integer('seats_remaining').notNull(),
  trainerName: text('trainer_name').notNull(),
  trainerEmail: text('trainer_email').notNull(),
  status: trainingSessionStatusEnum('status').notNull().default('scheduled'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
