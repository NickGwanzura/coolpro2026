import { index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { courses } from './courses';

// In-app notifications for any signed-in user (a decision on their request, a graded exam, a
// course returned for correction). Email still goes out for the important ones; this is what the
// bell in the top bar shows.
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  kind: text('kind').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  // A path inside the app, such as /certifications, that the notification opens.
  link: text('link'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
}, (table) => [
  index('notifications_user_idx').on(table.userId, table.readAt, table.createdAt),
]);

// How far a learner has got through a course, saved on the server so it follows them across
// devices and trainers can see it. completedModules holds the zero-based module numbers ticked off.
export const courseProgress = pgTable('course_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  completedModules: jsonb('completed_modules').$type<number[]>().notNull().default([]),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  moduleCount: integer('module_count').notNull().default(0),
}, (table) => [
  unique('course_progress_user_course_unique').on(table.userId, table.courseId),
]);
