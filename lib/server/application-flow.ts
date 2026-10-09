import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  registrationApplications,
  studentApplications,
  supplierApplications,
  technicianApplications,
} from '@/db/schema/index';
import { APPLICANT_ROLES, type ApplicantRole } from '@/lib/application-roles';
import { SITE_URL } from '@/lib/site-url';
import { recordAuditEvent } from '@/lib/server/audit';
import { checkDecisionAllowed, type ReviewAction } from '@/lib/server/application-rules';
import {
  consumeEmailVerification,
  createEmailVerification,
  isVerificationPending,
  type ApplicationEntityType,
} from '@/lib/server/email-verification';
import {
  sendApplicationReceivedEmail,
  sendApplicationRejectedEmail,
  sendApprovalEmail,
  sendVerificationEmail,
} from '@/lib/server/email';
import { logEmail } from '@/lib/server/email-log';
import { notifyAdminsOfNewApplication } from '@/lib/server/notify-admins';
import { VERIFICATION_TTL_HOURS, type VerificationState } from '@/lib/server/verification-token';

export interface ApplicationIdentity {
  entityType: ApplicationEntityType;
  entityId: string;
  role: ApplicantRole;
  name: string;
  email: string;
}

const ENTITY_ROLE: Record<Exclude<ApplicationEntityType, 'registration_application'>, ApplicantRole> = {
  technician_application: 'technician',
  student_application: 'student',
  supplier_application: 'supplier',
};

/** Looks up who an application belongs to, whatever table it lives in. */
export async function describeApplication(
  entityType: ApplicationEntityType,
  entityId: string,
): Promise<(ApplicationIdentity & { status: string }) | null> {
  if (entityType === 'technician_application') {
    const [row] = await db.select().from(technicianApplications).where(eq(technicianApplications.id, entityId)).limit(1);
    return row ? { entityType, entityId, role: ENTITY_ROLE[entityType], name: row.name, email: row.email, status: row.status } : null;
  }
  if (entityType === 'student_application') {
    const [row] = await db.select().from(studentApplications).where(eq(studentApplications.id, entityId)).limit(1);
    return row
      ? { entityType, entityId, role: ENTITY_ROLE[entityType], name: `${row.firstName} ${row.lastName}`.trim(), email: row.email, status: row.status }
      : null;
  }
  if (entityType === 'supplier_application') {
    const [row] = await db.select().from(supplierApplications).where(eq(supplierApplications.id, entityId)).limit(1);
    return row ? { entityType, entityId, role: ENTITY_ROLE[entityType], name: row.contactName, email: row.email, status: row.status } : null;
  }
  const [row] = await db.select().from(registrationApplications).where(eq(registrationApplications.id, entityId)).limit(1);
  return row
    ? { entityType, entityId, role: row.role, name: `${row.firstName} ${row.lastName}`.trim(), email: row.email, status: row.status }
    : null;
}

async function sendAndLog(
  emailType: string,
  identity: Pick<ApplicationIdentity, 'entityType' | 'entityId' | 'email'>,
  send: () => Promise<{ sent: boolean }>,
): Promise<void> {
  let sent = false;
  try {
    sent = (await send()).sent;
  } catch {
    sent = false;
  }
  await logEmail({
    emailType,
    recipientEmail: identity.email,
    relatedEntityType: identity.entityType,
    relatedEntityId: identity.entityId,
    sent,
  }).catch(() => {});
}

/**
 * Called right after a self-registration is saved: asks the applicant to confirm their email.
 * Never throws, so a mail problem cannot fail the signup. The applicant can ask for another link.
 */
export async function startApplicantVerification(identity: ApplicationIdentity): Promise<void> {
  try {
    const token = await createEmailVerification({
      entityType: identity.entityType,
      entityId: identity.entityId,
      email: identity.email,
    });
    const verifyUrl = `${SITE_URL}/verify-email?token=${encodeURIComponent(token)}`;
    await sendAndLog('application_verification', identity, () =>
      sendVerificationEmail({
        email: identity.email,
        name: identity.name,
        role: identity.role,
        verifyUrl,
        hours: VERIFICATION_TTL_HOURS,
      }),
    );
    await recordAuditEvent({
      entityType: identity.entityType,
      entityId: identity.entityId,
      action: 'submitted',
      newStatus: 'submitted',
      performedBy: identity.name,
      performedByRole: 'applicant',
    }).catch(() => {});
  } catch (err) {
    console.error('[application-flow] could not start email verification:', err instanceof Error ? err.message : err);
  }
}

export interface VerificationOutcome {
  state: VerificationState;
  role?: ApplicantRole;
}

/**
 * Handles a clicked confirmation link. The first time it succeeds, the applicant gets the
 * "received" email and admins are told a confirmed application is waiting.
 */
export async function completeApplicantVerification(token: string): Promise<VerificationOutcome> {
  const result = await consumeEmailVerification(token);
  if (!result.entityType || !result.entityId) return { state: result.state };

  const identity = await describeApplication(result.entityType, result.entityId);
  if (!identity) return { state: 'invalid' };

  if (result.state === 'verified') {
    await sendAndLog('application_received', identity, () =>
      sendApplicationReceivedEmail({ email: identity.email, name: identity.name, role: identity.role }),
    );
    notifyAdminsOfNewApplication({
      applicantName: identity.name,
      applicantEmail: identity.email,
      roleLabel: APPLICANT_ROLES[identity.role].label.toLowerCase(),
      reviewPath: `${SITE_URL}/admin/applications`,
    }).catch(() => {});
    await recordAuditEvent({
      entityType: identity.entityType,
      entityId: identity.entityId,
      action: 'email_confirmed',
      performedBy: identity.name,
      performedByRole: 'applicant',
    }).catch(() => {});
  }
  return { state: result.state, role: identity.role };
}

/** Sends a fresh confirmation link for an application that is still waiting on its email check. */
export async function resendApplicantVerification(entityType: ApplicationEntityType, entityId: string): Promise<boolean> {
  const identity = await describeApplication(entityType, entityId);
  if (!identity || !['submitted', 'under-review'].includes(identity.status)) return false;
  if (!(await isVerificationPending(entityType, entityId))) return false;
  await startApplicantVerification(identity);
  return true;
}

/** Why a decision cannot go ahead (wrong status, unconfirmed email), or null. */
export async function reviewBlockedReason(
  entityType: ApplicationEntityType,
  entityId: string,
  status: string,
  action: ReviewAction,
): Promise<string | null> {
  const emailUnconfirmed = action === 'approve' ? await isVerificationPending(entityType, entityId) : false;
  return checkDecisionAllowed({ status, action, emailUnconfirmed });
}

/** Emails the applicant and records the decision. Best-effort: never blocks the approval. */
export async function afterApplicationApproved(identity: ApplicationIdentity, reviewer: { name: string; role: string }, previousStatus: string): Promise<void> {
  await sendAndLog('application_approved', identity, () =>
    sendApprovalEmail({ email: identity.email, name: identity.name, role: identity.role }),
  );
  await recordAuditEvent({
    entityType: identity.entityType,
    entityId: identity.entityId,
    action: 'approved',
    previousStatus,
    newStatus: 'approved',
    performedBy: reviewer.name,
    performedByRole: reviewer.role,
  }).catch(() => {});
}

/**
 * `applicantMessage` is the only text that reaches the applicant. `internalNote` is stored for
 * admins and is never put in an email.
 */
export async function afterApplicationRejected(
  identity: ApplicationIdentity,
  reviewer: { name: string; role: string },
  previousStatus: string,
  notes: { applicantMessage?: string; internalNote?: string },
): Promise<void> {
  await sendAndLog('application_rejected', identity, () =>
    sendApplicationRejectedEmail({
      email: identity.email,
      name: identity.name,
      role: identity.role,
      applicantMessage: notes.applicantMessage?.trim() || undefined,
    }),
  );
  await recordAuditEvent({
    entityType: identity.entityType,
    entityId: identity.entityId,
    action: 'rejected',
    previousStatus,
    newStatus: 'rejected',
    performedBy: reviewer.name,
    performedByRole: reviewer.role,
    notes: notes.internalNote,
  }).catch(() => {});
}
