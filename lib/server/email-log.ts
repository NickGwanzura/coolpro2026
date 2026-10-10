import { db } from '@/db/client';
import { emailLog } from '@/db/schema/index';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The related-record column only holds record ids. If a caller passes anything else (an email
 * address, say), keep it as the label instead of letting the insert fail and the email go
 * unrecorded.
 */
export function splitRelated(entityId: string | undefined, label: string | undefined): { entityId: string | null; label: string | null } {
  if (entityId && UUID_PATTERN.test(entityId)) return { entityId, label: label ?? null };
  return { entityId: null, label: label ?? entityId ?? null };
}

/**
 * Records an outbound email in the Email Activity log. The email functions in email.ts call this
 * themselves for every send; only the outcome, the subject and a pointer to the related record are
 * stored, never the body (it can hold one-time sign-in or reset links).
 */
export async function logEmail(input: {
  emailType: string;
  recipientEmail: string;
  subject?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedLabel?: string;
  sent: boolean;
  errorMessage?: string;
  providerMessageId?: string;
}): Promise<void> {
  const related = splitRelated(input.relatedEntityId, input.relatedLabel);
  await db.insert(emailLog).values({
    emailType: input.emailType,
    recipientEmail: input.recipientEmail,
    subject: input.subject ?? null,
    relatedEntityType: input.relatedEntityType ?? null,
    relatedEntityId: related.entityId,
    relatedLabel: related.label?.slice(0, 200) ?? null,
    status: input.sent ? 'sent' : 'failed',
    errorMessage: input.errorMessage?.slice(0, 1000) ?? null,
    providerMessageId: input.providerMessageId ?? null,
  });
}
