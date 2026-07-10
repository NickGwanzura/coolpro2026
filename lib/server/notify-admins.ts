import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema/index';
import { sendAdminNoticeEmail } from '@/lib/server/email';

/**
 * Notifies every active org_admin that a new applicant is awaiting review.
 * Fire-and-forget by design (callers should not await this in the request's
 * critical path) — a failed or unconfigured send must never block a signup.
 */
export async function notifyAdminsOfNewApplication(input: {
  applicantName: string;
  applicantEmail: string;
  roleLabel: string;
  reviewPath: string;
}): Promise<void> {
  const admins = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(and(eq(users.role, 'org_admin'), eq(users.status, 'active')));

  if (admins.length === 0) return;

  await Promise.all(
    admins.map((admin) =>
      sendAdminNoticeEmail({
        email: admin.email,
        name: admin.name,
        title: `New ${input.roleLabel} application awaiting review`,
        message: `${input.applicantName} (${input.applicantEmail}) has submitted a ${input.roleLabel} application on the NOU / HEVACRAZ registry and is waiting for approval.`,
        action: `Review and approve or reject this application at ${input.reviewPath}.`,
      }).catch(() => {}),
    ),
  );
}
