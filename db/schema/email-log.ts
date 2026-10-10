import { index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// sent = accepted by the mail provider. delivered, delayed, bounced and complained arrive later from
// the provider's webhook. failed means the provider refused it (or it never left the app).
export const emailLogStatusEnum = pgEnum('email_log_status', ['sent', 'failed', 'delivered', 'bounced', 'complained', 'delayed']);

export const emailLog = pgTable('email_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailType: text('email_type').notNull(),
  recipientEmail: text('recipient_email').notNull(),
  subject: text('subject'),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: uuid('related_entity_id'),
  // A human label for the related record, such as the applicant's name.
  relatedLabel: text('related_label'),
  status: emailLogStatusEnum('status').notNull(),
  // Why it failed or bounced, in the provider's words.
  errorMessage: text('error_message'),
  // The provider's id for the message, used to match its delivery webhooks.
  providerMessageId: text('provider_message_id'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
  statusUpdatedAt: timestamp('status_updated_at', { withTimezone: true }),
}, (table) => [
  index('email_log_sent_at_idx').on(table.sentAt),
  index('email_log_provider_id_idx').on(table.providerMessageId),
  index('email_log_recipient_idx').on(table.recipientEmail),
]);
