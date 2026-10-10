import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { sendNewApplicationAdminEmail } from '@/lib/server/email';
import type { DetailRow } from '@/lib/application-details';
import { isUndeliverableAddress } from '@/lib/deliverable-address';

/**
 * Emails every active org_admin that a new application has been submitted. The only ones skipped
 * are placeholder addresses that cannot receive mail (such as the @coolpro.demo sample account).
 * Each send is logged. Fire-and-forget by design: a failed or unconfigured send must never block
 * a signup, so this never throws.
 */
export async function notifyAdminsOfNewApplication(input: {
  applicantName: string;
  applicantEmail: string;
  roleLabel: string;
  reviewPath: string;
  details?: DetailRow[];
  /** False for a self-registration whose email link has not been clicked yet. */
  emailConfirmed?: boolean;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  let admins: Array<{ email: string; name: string }>;
  try {
    admins = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(and(eq(users.role, 'org_admin'), eq(users.status, 'active')));
  } catch (err) {
    console.error('[notify-admins] could not load administrators:', err instanceof Error ? err.message : err);
    return;
  }
  admins = admins.filter((admin) => !isUndeliverableAddress(admin.email));
  if (admins.length === 0) return;

  await Promise.all(
    admins.map(async (admin) => {
      try {
        await sendNewApplicationAdminEmail({
          to: admin.email,
          adminName: admin.name,
          roleLabel: input.roleLabel,
          applicantName: input.applicantName,
          applicantEmail: input.applicantEmail,
          details: input.details ?? [],
          emailConfirmed: input.emailConfirmed ?? true,
          reviewUrl: input.reviewPath,
          log: { entityType: input.entityType, entityId: input.entityId, label: input.applicantName },
        });
      } catch {
        // Sending never throws, but one failed administrator must not stop the others.
      }
    }),
  );
}
