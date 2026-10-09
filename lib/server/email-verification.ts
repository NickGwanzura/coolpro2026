import { and, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { emailVerifications } from '@/db/schema/index';
import {
  evaluateVerification,
  generateVerificationToken,
  hashVerificationToken,
  verificationExpiry,
  type VerificationState,
} from '@/lib/server/verification-token';

export type ApplicationEntityType =
  | 'technician_application'
  | 'student_application'
  | 'supplier_application'
  | 'registration_application';

/**
 * Starts (or restarts) email confirmation for an application. Any earlier unused link for the same
 * application is removed, so only the newest link works. Returns the raw token for the email.
 */
export async function createEmailVerification(input: {
  entityType: ApplicationEntityType;
  entityId: string;
  email: string;
}): Promise<string> {
  const { token, tokenHash } = generateVerificationToken();
  await db
    .delete(emailVerifications)
    .where(and(
      eq(emailVerifications.entityType, input.entityType),
      eq(emailVerifications.entityId, input.entityId),
      isNull(emailVerifications.verifiedAt),
    ));
  await db.insert(emailVerifications).values({
    entityType: input.entityType,
    entityId: input.entityId,
    email: input.email,
    tokenHash,
    expiresAt: verificationExpiry(),
  });
  return token;
}

export interface VerificationResult {
  state: VerificationState;
  entityType?: ApplicationEntityType;
  entityId?: string;
  email?: string;
}

/** Marks the link's application as verified. Safe to call twice with the same link. */
export async function consumeEmailVerification(token: string): Promise<VerificationResult> {
  if (!token || token.length > 200) return { state: 'invalid' };
  const [row] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.tokenHash, hashVerificationToken(token)))
    .limit(1);

  const state = evaluateVerification(row);
  if (!row || state === 'invalid') return { state: 'invalid' };
  const identity = { entityType: row.entityType as ApplicationEntityType, entityId: row.entityId, email: row.email };
  if (state === 'verified') {
    await db.update(emailVerifications).set({ verifiedAt: new Date() }).where(eq(emailVerifications.id, row.id));
  }
  return { state, ...identity };
}

/**
 * True when the application went through self-registration and its email is still unconfirmed.
 * Applications an admin created have no verification row and are never blocked.
 */
export async function isVerificationPending(entityType: ApplicationEntityType, entityId: string): Promise<boolean> {
  const rows = await db
    .select({ verifiedAt: emailVerifications.verifiedAt })
    .from(emailVerifications)
    .where(and(eq(emailVerifications.entityType, entityType), eq(emailVerifications.entityId, entityId)));
  return rows.length > 0 && rows.every((row) => row.verifiedAt === null);
}

/** Of the given application ids, which still have an unconfirmed email. Used to flag admin lists. */
export async function pendingVerificationIds(entityType: ApplicationEntityType, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const [open, done] = await Promise.all([
    db.select({ id: emailVerifications.entityId }).from(emailVerifications)
      .where(and(eq(emailVerifications.entityType, entityType), inArray(emailVerifications.entityId, ids), isNull(emailVerifications.verifiedAt))),
    db.select({ id: emailVerifications.entityId }).from(emailVerifications)
      .where(and(eq(emailVerifications.entityType, entityType), inArray(emailVerifications.entityId, ids), isNotNull(emailVerifications.verifiedAt))),
  ]);
  const verified = new Set(done.map((row) => row.id));
  return new Set(open.map((row) => row.id).filter((id) => !verified.has(id)));
}

/** Latest unconfirmed application ids for an email address, newest first (used to resend a link). */
export async function latestPendingForEmail(email: string): Promise<Array<{ entityType: ApplicationEntityType; entityId: string }>> {
  const rows = await db
    .select({ entityType: emailVerifications.entityType, entityId: emailVerifications.entityId })
    .from(emailVerifications)
    .where(and(eq(emailVerifications.email, email), isNull(emailVerifications.verifiedAt)))
    .orderBy(desc(emailVerifications.createdAt))
    .limit(5);
  return rows.map((row) => ({ entityType: row.entityType as ApplicationEntityType, entityId: row.entityId }));
}
