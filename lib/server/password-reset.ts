import { createHash, randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { applicationAuditLog } from '@/db/schema/audit';
import { passwordResetTokens } from '@/db/schema/password-reset';

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

export function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issuePasswordResetToken(
  userId: string,
  requestedBy?: { email: string; role: string },
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const tokenHash = hashPasswordResetToken(token);

  await db.transaction(async (tx) => {
    await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    await tx.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });

    if (requestedBy) {
      await tx.insert(applicationAuditLog).values({
        entityType: 'user',
        entityId: userId,
        action: 'password_reset_requested',
        previousStatus: null,
        newStatus: null,
        performedBy: requestedBy.email,
        performedByRole: requestedBy.role,
        notes: 'An administrator initiated password reset for this account.',
      });
    }
  });

  return { token, expiresAt };
}
