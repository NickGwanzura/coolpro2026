import { db } from '@/db/client';
import { emailLog } from '@/db/schema/index';

/**
 * Records an outbound email attempt. Called by API routes after invoking a send* function
 * from lib/server/email.ts — kept separate from that file so routes can log any email type
 * (including ones sent via sendApprovalEmail/sendInviteEmail, which are shared across
 * multiple flows) without every email function needing to know about entity linkage.
 */
export async function logEmail(input: {
  emailType: string;
  recipientEmail: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  sent: boolean;
  errorMessage?: string;
}): Promise<void> {
  await db.insert(emailLog).values({
    emailType: input.emailType,
    recipientEmail: input.recipientEmail,
    relatedEntityType: input.relatedEntityType ?? null,
    relatedEntityId: input.relatedEntityId ?? null,
    status: input.sent ? 'sent' : 'failed',
    errorMessage: input.errorMessage ?? null,
  });
}
