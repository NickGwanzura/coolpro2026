import { pgTable, pgEnum, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const emailLogStatusEnum = pgEnum('email_log_status', ['sent', 'failed']);

export const emailLog = pgTable('email_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailType: text('email_type').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: uuid('related_entity_id'),
  status: emailLogStatusEnum('status').notNull(),
  errorMessage: text('error_message'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
});
